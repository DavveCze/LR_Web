import { useState } from "react";

const DARK = "#1f2937";
const WHITE = "#ffffff";

type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
    target?: string;
    rel?: string;
    className?: string;
};

export const LightButton = ({
    children,
    onClick,
    href,
    target,
    rel,
    className = "",
    isBig,
    isMedium,
    isCentered,
    isRight,
    isFlexible,
}: ButtonProps & {
    isBig?: boolean;
    isMedium?: boolean;
    isCentered?: boolean;
    isRight?: boolean;
    isFlexible?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const style: React.CSSProperties = {
        backgroundColor: isHovered ? DARK : WHITE,
        color: isHovered ? WHITE : DARK,
        border: `1px solid ${DARK}`,
        transition: "background-color 200ms ease, color 200ms ease",
        textAlign: "center",
        ...(isCentered
            ? {
                  margin: "0 auto",
                  display: "flex",
              }
            : {}),
        ...(isRight
            ? {
                  marginLeft: "auto",
                  display: "flex",
              }
            : {}),
        ...(isFlexible
            ? {
                  width: "100%",
                  height: "3rem",
                  fontSize: "1.125rem",
              }
            : {}),
    };

    const classes = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer ${
        isBig
            ? "w-1/3 h-16 text-xl"
            : isMedium
            ? "w-1/5 h-14 text-xl"
            : isFlexible
            ? "w-full h-12 text-lg"
            : ""
    } ${className}`;

    if (href) {
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        const linkTarget = target ?? (isExternal ? "_blank" : undefined);
        const linkRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

        return (
            <a
                href={href}
                target={linkTarget}
                rel={linkRel}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={style}
                className={classes}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={style}
            className={classes}
        >
            {children}
        </button>
    );
};

export const DarkButton = ({
    children,
    onClick,
    href,
    target,
    rel,
    className = "",
    isBig,
    isMedium,
    isCentered,
    isRight,
    isFlexible,
}: ButtonProps & {
    isBig?: boolean;
    isMedium?: boolean;
    isCentered?: boolean;
    isRight?: boolean;
    isFlexible?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const style: React.CSSProperties = {
        backgroundColor: isHovered ? WHITE : DARK,
        color: isHovered ? DARK : WHITE,
        border: `1px solid ${DARK}`,
        transition: "background-color 200ms ease, color 200ms ease",
        textAlign: "center",
        ...(isCentered
            ? {
                  margin: "0 auto",
                  display: "flex",
              }
            : {}),
        ...(isRight
            ? {
                  marginLeft: "auto",
                  display: "flex",
              }
            : {}),
        ...(isFlexible
            ? {
                  width: "100%",
                  height: "3rem",
                  fontSize: "1.125rem",
              }
            : {}),
    };

    const classes = `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer ${
        isBig
            ? "w-1/3 h-16 text-xl"
            : isMedium
            ? "w-1/5 h-14 text-xl"
            : isFlexible
            ? "w-full h-12 text-lg"
            : ""
    } ${className}`;

    if (href) {
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        const linkTarget = target ?? (isExternal ? "_blank" : undefined);
        const linkRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

        return (
            <a
                href={href}
                target={linkTarget}
                rel={linkRel}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={style}
                className={classes}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={style}
            className={classes}
        >
            {children}
        </button>
    );
};