import { type ClassNameValue, twMerge as merge } from "tailwind-merge";

export function cn(...classLists: ClassNameValue[]): string {
  return merge(...classLists);
}
