import { Toaster as Sonner } from "sonner";
const Toaster = ({
  ...props
}) => {
  return <Sonner className="toaster group" toastOptions={{
    classNames: {
      toast: "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-teal-300/30 group-[.toaster]:bg-[#0b1626]/95 group-[.toaster]:text-white group-[.toaster]:shadow-[0_20px_60px_-15px_rgba(20,184,166,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] group-[.toaster]:backdrop-blur-xl group-[.toaster]:italic group-[.toaster]:font-semibold group-[.toaster]:tracking-wide",
      description: "group-[.toast]:text-teal-100/70 group-[.toast]:italic group-[.toast]:font-normal",
      actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
    }
  }} {...props} />;
};
export { Toaster };
