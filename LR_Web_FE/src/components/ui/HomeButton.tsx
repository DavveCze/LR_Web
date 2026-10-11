import { type FC } from "react";

export const HomeButton: FC<{
    color: string;
    content: string;
    href: string;
    arrows: boolean;
    target?: string;
    rel?: string;
}> = ({ color, content = "Více informací", href = "/", arrows = false, target, rel }) => {
    const sec_color = color === "#393939" ? "#ffffff" : "#393939"; 
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const linkTarget = target ?? (isExternal ? "_blank" : undefined);
    const linkRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

    return (
        <a
            href={href}
            target={linkTarget}
            rel={linkRel}
            className="w-fit inline-block rounded-lg px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
            style={{ backgroundColor: color, color: sec_color, border: `1px solid ${sec_color}` }}
        >
            {arrows ? `${content} >>` : `<< ${content}`}
        </a>
    );
};