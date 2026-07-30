import * as React from "react"
import { cn } from "@/lib/utils"

export const Select = ({ children, onValueChange }: { children: React.ReactNode, onValueChange?: (value: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string>("");
  
  const handleSelect = (value: string, label: string) => {
    setSelectedValue(label);
    if(onValueChange) onValueChange(value);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isOpen, setIsOpen, selectedValue, onSelect: handleSelect } as any);
        }
        return child;
      })}
    </div>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(({ className, children, isOpen, setIsOpen, selectedValue, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {selectedValue || children}
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span>{placeholder}</span>
}

export const SelectContent = ({ className, children, isOpen, onSelect }: any) => {
  if (!isOpen) return null;
  return (
    <div className={cn("absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 mt-1 w-full", className)}>
      <div className="p-1">
        {React.Children.map(children, child => {
           if (React.isValidElement(child)) {
             return React.cloneElement(child, { onSelect } as any);
           }
           return child;
        })}
      </div>
    </div>
  )
}

export const SelectItem = React.forwardRef<HTMLDivElement, any>(({ className, children, value, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    onClick={() => onSelect(value, children)}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"
