'use client';
import AceEditor from "react-ace";
import 'ace-builds';
import 'ace-builds/webpack-resolver';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export const JsonInput = forwardRef<ElementRef<typeof AceEditor>, ComponentPropsWithoutRef<typeof AceEditor>>((props, ref) => <AceEditor
    mode="json"
    theme="xcode"
    showGutter={false}
    maxLines={10}
    minLines={5}
    showPrintMargin={false}
    enableLiveAutocompletion
    enableBasicAutocompletion
    className='resize-none border-border rounded max-w-full data-[valid=false]:!border-destructive border bg-background p-3 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
    fontSize={14}
    ref={ref}
    {...props}
/>
)
JsonInput.displayName = "JsonInput";