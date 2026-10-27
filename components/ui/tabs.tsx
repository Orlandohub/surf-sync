"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"
import {
  StableLabel,
  tabsListClassName,
  tabsTriggerClassName,
} from "@/components/ui/tab-styles"

/**
 * surfsync DS (COMPONENTS.md "Tabs") — underline tabs, client state.
 * Not shadcn's pill. 2–4 tabs, one word each where possible
 * ("Próximas · Disponíveis · Histórico"). Full-width on mobile, left-aligned
 * on md+. The 2px `bg-primary` indicator slides in `duration-base ease-move`.
 *
 *   <Tabs defaultValue="upcoming">
 *     <TabsList aria-label="Aulas">
 *       <TabsTrigger value="upcoming">Próximas</TabsTrigger>
 *       <TabsTrigger value="history">Histórico</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="upcoming">…</TabsContent>
 *     <TabsContent value="history">…</TabsContent>
 *   </Tabs>
 *
 * When the tab must live in the URL (shareable, server-filtered lists),
 * use <LinkTabs> from "@/components/ui/link-tabs" instead — same look.
 */

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-section", className)}
      {...props}
    />
  )
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListClassName, className)}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        renderBeforeHydration
        className="absolute -bottom-px left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-[translate,width] duration-(--duration-base) ease-move"
      />
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, children, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerClassName, className)}
      {...props}
    >
      {typeof children === "string" ? <StableLabel>{children}</StableLabel> : children}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
