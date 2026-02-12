import * as React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    const classes = ["text-sm font-medium text-slate-200", className]
      .filter(Boolean)
      .join(" ");

    return <label ref={ref} className={classes} {...props} />;
  }
);

Label.displayName = "Label";
