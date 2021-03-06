/*
 * Generated type guards for "Settings.ts".
 * WARNING: Do not manually change this file.
 */
import type { Settings, Pattern, PatternRule, Command } from "./Settings";

export function isSettings(obj: any, _argumentName?: string): obj is Settings {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        Array.isArray(obj.patterns) &&
        obj.patterns.every((e: any) =>
            isPattern(e) as boolean
        ) &&
        typeof obj.filterString === "string" &&
        typeof obj.commandFilterString === "string" &&
        Array.isArray(obj.commands) &&
        obj.commands.every((e: any) =>
            isCommand(e) as boolean
        ) &&
        typeof obj.defaultCursorRegexStart === "string" &&
        typeof obj.defaultCursorRegexEnd === "string" &&
        typeof obj.apiVersion === "number"
    )
}

export function isPattern(obj: any, _argumentName?: string): obj is Pattern {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        typeof obj.name === "string" &&
        Array.isArray(obj.rules) &&
        obj.rules.every((e: any) =>
            isPatternRule(e) as boolean
        ) &&
        typeof obj.collapsed === "boolean" &&
        typeof obj.cursorRegexStart === "string" &&
        typeof obj.cursorRegexEnd === "string"
    )
}

export function isPatternRule(obj: any, _argumentName?: string): obj is PatternRule {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        typeof obj.from === "string" &&
        typeof obj.to === "string" &&
        typeof obj.caseInsensitive === "boolean" &&
        typeof obj.global === "boolean" &&
        typeof obj.multiline === "boolean" &&
        typeof obj.sticky === "boolean" &&
        typeof obj.disabled === "boolean"
    )
}

export function isCommand(obj: any, _argumentName?: string): obj is Command {
    return (
        (obj !== null &&
            typeof obj === "object" ||
            typeof obj === "function") &&
        typeof obj.name === "string" &&
        typeof obj.icon === "string" &&
        typeof obj.patternFilter === "string" &&
        typeof obj.selection === "boolean" &&
        typeof obj.lines === "boolean" &&
        typeof obj.document === "boolean" &&
        typeof obj.clipboard === "boolean" &&
        typeof obj.clipboardLines === "boolean"
    )
}
