import { ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BentoGrid = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "grid w-full auto-rows-[10rem] md:auto-rows-[16rem] lg:auto-rows-[22rem] grid-cols-2 md:grid-cols-3 gap-2 md:gap-4",
                className,
            )}
        >
            {children}
        </div>
    );
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: {
    name: string;
    className: string;
    background: ReactNode;
    Icon: any;
    description: string;
    href: string;
    cta: string;
}) => (
    <div
        key={name}
        className={cn(
            "group relative col-span-1 md:col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
            // light styles
            "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
            // dark styles
            "transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
            className,
        )}
    >
        <div>{background}</div>
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-0.5 md:gap-1 p-3 md:p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-6 w-6 md:h-12 md:w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
            <h3 className="text-sm md:text-xl font-semibold text-neutral-700 dark:text-neutral-300 line-clamp-2">
                {name}
            </h3>
            <p className="max-w-lg text-[10px] md:text-sm text-neutral-400 line-clamp-2 md:line-clamp-3">{description}</p>
        </div>

        <div
            className={cn(
                "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-2 md:p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
            )}
        >
            <Button variant="ghost" asChild size="sm" className="pointer-events-auto text-xs md:text-sm">
                <a href={href}>
                    {cta}
                    <ArrowRightIcon className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </a>
            </Button>
        </div>
        <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
    </div>
);

export { BentoCard, BentoGrid };
