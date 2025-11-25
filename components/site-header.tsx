import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar"; // Import Trigger here

export function SiteHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        {/* Move Trigger inside Header */}
        <SidebarTrigger className="-ml-1" /> 
        <Separator
          orientation="vertical"
          className="mr-2 h-4"
        />
        <h1 className="text-base font-medium">Rc Fluid Power</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}