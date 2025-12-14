"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Since we don't have @radix-ui/react-accordion installed, 
// I will implement a simple custom version that mimics the API.
// If the user wants the real shadcn component, they should install the dependency.
// For now, to satisfy "pixel perfect" without installing new deps unless necessary:

const AccordionContext = React.createContext<{
  expanded: string | undefined;
  setExpanded: (value: string | undefined) => void;
}>({ expanded: undefined, setExpanded: () => {} });

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: "single"; collapsible?: boolean }
>(({ className, children, ...props }, ref) => {
  const [expanded, setExpanded] = React.useState<string | undefined>(undefined);

  return (
    <AccordionContext.Provider value={{ expanded, setExpanded }}>
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} data-value={value} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { expanded, setExpanded } = React.useContext(AccordionContext);
  // Find the parent item value (hacky but works for simple structure)
  // In a real app, we'd use a context for the Item too.
  // Let's wrap Item in context.
  
  return (
    <h3 className="flex">
      <button
        ref={ref}
        onClick={(e) => {
           const item = e.currentTarget.closest('[data-value]') as HTMLElement;
           const value = item?.dataset.value;
           setExpanded(expanded === value ? undefined : value);
           props.onClick?.(e);
        }}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
        type="button"
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    </h3>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { expanded } = React.useContext(AccordionContext);
  const internalRef = React.useRef<HTMLDivElement>(null);
  
  // We need to know which item we are in.
  // This is getting complicated to mock perfectly.
  // I will assume the parent Item passes context if I refactor.
  
  return (
      <AccordionContentInternal className={className} {...props} ref={ref}>{children}</AccordionContentInternal>
  )
})
AccordionContent.displayName = "AccordionContent"

// Better implementation with Item Context
const AccordionItemContext = React.createContext<{ value: string }>({ value: "" });

const AccordionItemNew = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
  <AccordionItemContext.Provider value={{ value }}>
    <div ref={ref} className={cn("border-b", className)} data-value={value} {...props}>
      {children}
    </div>
  </AccordionItemContext.Provider>
))
AccordionItemNew.displayName = "AccordionItem"

const AccordionTriggerNew = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { expanded, setExpanded } = React.useContext(AccordionContext);
  const { value } = React.useContext(AccordionItemContext);
  const isOpen = expanded === value;

  return (
    <h3 className="flex">
      <button
        ref={ref}
        onClick={() => setExpanded(isOpen ? undefined : value)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
        type="button"
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
    </h3>
  )
})
AccordionTriggerNew.displayName = "AccordionTrigger"

const AccordionContentInternal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { expanded } = React.useContext(AccordionContext);
  const { value } = React.useContext(AccordionItemContext);
  const isOpen = expanded === value;

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden text-sm transition-all animate-accordion-down", className)}
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
})
AccordionContentInternal.displayName = "AccordionContent"

export { Accordion, AccordionItemNew as AccordionItem, AccordionTriggerNew as AccordionTrigger, AccordionContent }

