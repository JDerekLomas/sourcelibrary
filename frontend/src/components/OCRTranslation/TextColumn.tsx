import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PencilIcon, PhotoIcon } from "@heroicons/react/24/solid";
import ToggleSwitch from "./ToggleSwitch";
import { RoleGuard, ResourceType, ActionType } from "../../auth/RoleGuard";

interface TextColumnProps {
    title: string;
    language: string;
    charCount: number;
    data: string;
    onTextChange: (value: string) => void;
    fontSize: number;
    apiRunning: boolean;
    apiRunningText: string;
    markdownTogglePermissions: { resource: ResourceType, action: ActionType };
    footer?: React.ReactNode;
}

// Process [[notes: ...]] patterns into footnotes
const processNotesAsFootnotes = (text: string): { processedText: string; footnotes: string[] } => {
    if (!text) return { processedText: "", footnotes: [] };

    const footnotes: string[] = [];
    let counter = 1;

    const notePattern = /\[\[([^\]]+)\]\]/g;

    const processedText = text.replace(notePattern, (match, noteContent) => {
        if (noteContent.toLowerCase().startsWith("page:")) {
            return match;
        }
        footnotes.push(noteContent.trim());
        return `<sup class="footnote-ref">[${counter++}]</sup>`;
    });

    return { processedText, footnotes };
};

const TextColumn: React.FC<TextColumnProps> = ({
    title,
    language,
    charCount,
    data,
    onTextChange,
    fontSize,
    apiRunning,
    apiRunningText,
    markdownTogglePermissions,
    footer,
}) => {
    const [showMarkdown, setShowMarkdown] = useState(true);
    const [forceEdit, setForceEdit] = useState(false);

    useEffect(() => { setForceEdit(!showMarkdown) }, [showMarkdown]);

    const { processedText, footnotes } = useMemo(() => processNotesAsFootnotes(data), [data]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-lg font-serif font-semibold text-gray-900">
                    {title}
                </h2>
                <div className="flex gap-2">
                    <span className="px-2 py-2 bg-gray-100 text-gray-800 text-xs font-mono rounded border">
                        {language}
                    </span>
                    <span className="px-2 py-2 bg-gray-100 text-gray-800 text-xs font-mono rounded border">
                        {charCount} chars
                    </span>
                    <RoleGuard resource={markdownTogglePermissions.resource} action={markdownTogglePermissions.action}>
                        <ToggleSwitch
                            value={showMarkdown}
                            onToggle={setShowMarkdown}
                            leftContent={<PhotoIcon className="h-4 w-4" />}
                            rightContent={<PencilIcon className="h-4 w-4" />}
                            className="ml-2"
                            buttonClassName="px-2 py-1"
                        />
                    </RoleGuard>
                </div>
            </div>

            {apiRunning && (
                <div className="flex items-center space-x-2 text-gray-600 text-sm font-serif mb-3 p-2 bg-gray-50 rounded flex-shrink-0">
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-600 rounded-full animate-pulse"></div>
                        <div
                            className="w-1 h-1 bg-gray-600 rounded-full animate-pulse"
                            style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                            className="w-1 h-1 bg-gray-600 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                        ></div>
                    </div>
                    <span>{apiRunningText}</span>
                </div>
            )}

            <div className="flex-1 min-h-0">
                {!forceEdit ? (
                    <div
                        className={[
                            "w-full h-full p-3 border border-gray-300 rounded",
                            "font-serif bg-gray-100",
                            "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100",
                            "min-h-[200px] sm:min-h-[300px] prose prose-sm max-w-none",
                        ].join(" ")}
                        style={{
                            fontSize: `${Math.max(12, fontSize)}px`,
                            wordWrap: "break-word",
                        }}
                    >
                        {data ? (
                        <>
                            <ReactMarkdown
                                remarkPlugins={[remarkBreaks, remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    img: ({ node, ...props }) => (
                                        <img
                                            {...props}
                                            style={{
                                                maxWidth: "100%",
                                                width: "auto",
                                                height: "auto",
                                                display: "block",
                                                margin: "0 auto",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ),
                                    table: ({ children }) => (
                                        <table className="min-w-full border-collapse border border-gray-300 my-4">{children}</table>
                                    ),
                                    th: ({ children }) => (
                                        <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>
                                    ),
                                    td: ({ children }) => (
                                        <td className="border border-gray-300 px-3 py-2">{children}</td>
                                    ),
                                    sup: ({ children, className }) => (
                                        <sup className={`text-purple-600 font-semibold cursor-help ${className || ""}`}>{children}</sup>
                                    ),
                                }}
                            >
                                {processedText}
                            </ReactMarkdown>
                            {footnotes.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                                    <ol className="text-xs text-gray-600 space-y-0.5">
                                        {footnotes.map((note, index) => (
                                            <li key={index}>
                                                <span className="text-purple-600 font-semibold">[{index + 1}]</span> {note}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </>
                        ) : (
                            <div className="text-gray-400">{title === "OCR Text" ? "OCR text will appear here..." : "Original text not translated yet..."}</div>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={data}
                        onChange={(e) => onTextChange(e.target.value)}
                        placeholder={title === "OCR Text" ? "OCR text will appear here..." : "Translation will appear here"}
                        className={[
                            "w-full h-full p-3 border border-gray-300 rounded resize-none",
                            "focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-serif touch-manipulation",
                            "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100",
                            "min-h-[200px] sm:min-h-[300px] transition-colors duration-200",
                            "bg-white",
                        ].join(" ")}
                        style={{
                            fontSize: `${Math.max(12, fontSize)}px`,
                            wordWrap: "break-word",
                            whiteSpace: "pre-wrap",
                        }}
                    />
                )}
            </div>

            {footer}
        </div>
    );
};

export default TextColumn;
