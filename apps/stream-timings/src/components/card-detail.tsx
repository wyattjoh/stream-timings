type Props = {
  title: string;
  children: React.ReactNode;
};

export function CardDetail({ title, children }: Props) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="text-xs text-gray-700 dark:text-slate-400">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
