import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ id, title, children, className }: Props) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col space-y-3 bg-slate-300 dark:bg-slate-800 dark:text-slate-200 p-3 text-sm border dark:border-slate-600",
        className
      )}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}
