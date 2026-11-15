import { type FC } from "react";
import { Link } from "react-router-dom";

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

    const resolvedDirection: "left" | "right" =
        direction ?? (arrows === false ? "left" : "right");

    const buttonClass = `w-fit inline-block rounded-lg px-6 py-3 text-sm font-medium transition hover:opacity-80 text-center ${className}`;
    const buttonStyle = { backgroundColor: color, color: sec_color, border: `1px solid ${sec_color}` };

    const renderedContent = (
        <>
            {resolvedDirection === "left" && (
                <span className="hidden sm:inline" aria-hidden="true">‹‹ </span>
            )}
            <span>{content}</span>
            {resolvedDirection === "right" && (
                <span className="hidden sm:inline" aria-hidden="true"> ››</span>
            )}
        </>
    );

    if (!isExternal) {
        return (
            <Link
                to={href}
                className={buttonClass}
                style={buttonStyle}
            >
                {renderedContent}
            </Link>
        );
    }

    return (
        <a
            href={href}
            target={linkTarget}
            rel={linkRel}
            className={buttonClass}
            style={buttonStyle}
        >
            {renderedContent}
        </a>
    );
};
