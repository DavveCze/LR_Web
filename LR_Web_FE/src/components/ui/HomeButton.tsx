import { type FC } from "react";

export interface HomeButtonProps {
    color: string;
    content: string;
    href: string;
    direction?: "left" | "right";
    arrows?: boolean; // zpětná kompatibilita: true = right, false = left
    target?: string;
    rel?: string;
    className?: string;
}

export const HomeButton: FC<HomeButtonProps> = ({
    color,
    content = "Více informací",
    href = "/",
    direction,
    arrows,
    target,
    rel,
    className = "",
}) => {
    const sec_color = color === "#393939" ? "#ffffff" : "#393939";
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const linkTarget = target ?? (isExternal ? "_blank" : undefined);
    const linkRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

    // Směr šipky: explicitní direction má přednost před legacy booleanem arrows
    const resolvedDirection: "left" | "right" =
        direction ?? (arrows === false ? "left" : "right");

    return (
        <a
            href={href}
            target={linkTarget}
            rel={linkRel}
            className={`w-fit inline-block rounded-lg px-6 py-3 text-sm font-medium transition hover:opacity-80 ${className}`}
            style={{ backgroundColor: color, color: sec_color, border: `1px solid ${sec_color}` }}
        >
            {resolvedDirection === "right" ? `${content} ››` : `‹‹ ${content}`}
        </a>
    );
};
