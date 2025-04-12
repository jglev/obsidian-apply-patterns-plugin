/*
 * Generated type guards for "Settings.ts".
 * WARNING: Do not manually change this file.
 */
import type { Settings, Pattern, PatternRule, Command } from "./Settings";

export function isSettings(obj: unknown): obj is Settings {
    const typedObj = obj as Settings
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["patterns"]) &&
        typedObj["patterns"].every((e: any) =>
            isPattern(e) as boolean
        ) &&
        typeof typedObj["filterString"] === "string" &&
        typeof typedObj["commandFilterString"] === "string" &&
        Array.isArray(typedObj["commands"]) &&
        typedObj["commands"].every((e: any) =>
            isCommand(e) as boolean
        ) &&
        typeof typedObj["defaultCursorRegexStart"] === "string" &&
        typeof typedObj["defaultCursorRegexEnd"] === "string" &&
        typeof typedObj["apiVersion"] === "number"
    )
}

export function isPattern(obj: unknown): obj is Pattern {
    const typedObj = obj as Pattern
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["name"] === "string" &&
        Array.isArray(typedObj["rules"]) &&
        typedObj["rules"].every((e: any) =>
            isPatternRule(e) as boolean
        ) &&
        typeof typedObj["collapsed"] === "boolean" &&
        typeof typedObj["cursorRegexStart"] === "string" &&
        typeof typedObj["cursorRegexEnd"] === "string"
    )
}

export function isPatternRule(obj: unknown): obj is PatternRule {
    const typedObj = obj as PatternRule
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["from"] === "string" &&
        typeof typedObj["to"] === "string" &&
        typeof typedObj["caseInsensitive"] === "boolean" &&
        typeof typedObj["global"] === "boolean" &&
        typeof typedObj["multiline"] === "boolean" &&
        typeof typedObj["sticky"] === "boolean" &&
        typeof typedObj["disabled"] === "boolean"
    )
}

export function isCommand(obj: unknown): obj is Command {
    const typedObj = obj as Command
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["name"] === "string" &&
        typeof typedObj["icon"] === "string" &&
        typeof typedObj["patternFilter"] === "string" &&
        typeof typedObj["selection"] === "boolean" &&
        typeof typedObj["lines"] === "boolean" &&
        typeof typedObj["document"] === "boolean" &&
        typeof typedObj["clipboard"] === "boolean" &&
        typeof typedObj["clipboardLines"] === "boolean"
    )
}
