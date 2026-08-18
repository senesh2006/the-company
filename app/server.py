import os
import sys
import threading
import socket
import logging
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server_entrypoint")


def start_port_bridge(source_port: int, target_port: int):
    """
    Bridges incoming TCP connections from source_port to target_port.
    Guarantees that whether Railway's edge proxy hits port 8000 or port 8080 (or $PORT),
    the request is seamlessly served by FastAPI.
    """
    if source_port == target_port:
        return

    def bridge_worker():
        try:
            server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server.bind(("0.0.0.0", source_port))
            server.listen(256)
            logger.info(f"Port Bridge: Forwarding 0.0.0.0:{source_port} -> 127.0.0.1:{target_port}")

            def handle_client(client_sock):
                try:
                    target_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    target_sock.connect(("127.0.0.1", target_port))

                    def pipe(src, dst):
                        try:
                            while True:
                                data = src.recv(16384)
                                if not data:
                                    break
                                dst.sendall(data)
                        except Exception:
                            pass
                        finally:
                            try:
                                src.close()
                            except Exception:
                                pass
                            try:
                                dst.close()
                            except Exception:
                                pass

                    t1 = threading.Thread(target=pipe, args=(client_sock, target_sock), daemon=True)
                    t2 = threading.Thread(target=pipe, args=(target_sock, client_sock), daemon=True)
                    t1.start()
                    t2.start()
                except Exception as e:
                    try:
                        client_sock.close()
                    except Exception:
                        pass

            while True:
                client_sock, _ = server.accept()
                threading.Thread(target=handle_client, args=(client_sock,), daemon=True).start()
        except Exception as e:
            logger.debug(f"Port bridge on {source_port} inactive: {e}")

    thread = threading.Thread(target=bridge_worker, daemon=True)
    thread.start()


if __name__ == "__main__":
    port_env = os.environ.get("PORT", "8080")
    try:
        primary_port = int(port_env)
    except ValueError:
        primary_port = 8080

    logger.info(f"Starting server on primary port {primary_port} (PORT env={port_env})...")

    # Start bridges on standard cloud ports (8000 and 8080)
    for p in [8000, 8080]:
        if p != primary_port:
            start_port_bridge(p, primary_port)

    uvicorn.run("app.main:app", host="0.0.0.0", port=primary_port, log_level="info")
