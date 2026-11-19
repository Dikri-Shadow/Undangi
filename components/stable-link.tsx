import type { AnchorHTMLAttributes, ReactNode } from "react";

type StableLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export function StableLink({ href, children, ...props }: StableLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}
