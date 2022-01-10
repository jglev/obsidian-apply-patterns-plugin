import {
	App,
	Editor,
	EditorTransaction,
	EditorRangeOrCaret,
	MarkdownView,
	Notice,
	View,
} from 'obsidian';

import { validateRuleString } from './ValidateRuleString';
import { PatternModal } from './PatternsModal';
import { Command, getSettings } from './Settings';
import { cursorTo } from 'readline';

const calculateCursorPoints = (
	minLine: number,
	lines: Array<string>,
	cursorStartRegex: { valid: boolean | null; string: string },
	cursorEndRegex: { valid: boolean | null; string: string },
): {
	from: { line: number; ch: number };
	to?: { line: number; ch: number };
} => {
	let cursorStart = { line: minLine, ch: 0 };
	let cursorEnd = { line: minLine, ch: 0 };

	let cursorStartMatch = lines
		.join('\n')
		.match(new RegExp(cursorStartRegex.string));

	let cursorEndMatch = lines
		.join('\n')
		.match(new RegExp(cursorEndRegex.string));

	if (cursorStartMatch === null && cursorEndMatch !== null) {
		cursorStartMatch = cursorEndMatch;
	} else if (cursorEndMatch === null && cursorStartMatch !== null) {
		cursorEndMatch = cursorStartMatch;
	}

	if (cursorStartMatch !== null) {
		const beforeCursorMatch = lines
			.join('\n')
			.slice(0, cursorStartMatch.index)
			.split('\n');
		cursorStart = {
			line: minLine + beforeCursorMatch.length - 1,
			ch: beforeCursorMatch[beforeCursorMatch.length - 1].length,
		};
	}

	if (cursorEndMatch !== null) {
		const beforeCursorMatch = lines
			.join('\n')
			.slice(0, cursorEndMatch.index)
			.split('\n');
		cursorEnd = {
			line: minLine + beforeCursorMatch.length - 1,
			ch: beforeCursorMatch[beforeCursorMatch.length - 1].length,
		};
	}

	const output: EditorRangeOrCaret = { from: cursorStart };

	if (
		cursorStart.line !== cursorEnd.line ||
		cursorStart.ch !== cursorEnd.ch
	) {
		output.to = cursorEnd;
	}

	return output;
};

export const applyPattern = (
	checking: boolean,
	editor: Editor,
	view: View,
	app: App,
	mode: 'lines' | 'selection' | 'document' = 'lines',
	command?: Command,
) => {
	if (checking) {
		// editorCallback always happens in a MarkdownView; the command should
		// only be shown in MarkdownView:
		return true;
	}

	if (!(view instanceof MarkdownView)) {
		// Should never happen due to check above.
		return;
	}

	// We are certain we are in the editor due to the check above.
	const path = view.file?.path;
	if (path === undefined) {
		return;
	}

	const onChooseItem = (patternIndex: number): void => {
		const pattern = getSettings().patterns[patternIndex];
		const cursorFrom = editor.getCursor('from');
		const cursorTo = editor.getCursor('to');
		const minLine = cursorFrom.line;
		const maxLine = cursorTo.line;

		// Confirm that each rule's strings are valid:
		let allValid = true;
		const allRuleStringsValidated: { from: string; to: string }[] = [];

		const noticeTimeoutSeconds = 1000 * 30; // 30 seconds

		for (let ruleIndex = 0; ruleIndex < pattern.rules.length; ruleIndex++) {
			const rule = pattern.rules[ruleIndex];
			if (rule.disabled === true) {
				// Push a placeholder, to avoid messing up index numbers below:
				allRuleStringsValidated.push({
					from: '',
					to: '',
				});
				continue;
			}
			const fromValidated = validateRuleString(rule.from);
			const toValidated = validateRuleString(rule.to, false);
			allRuleStringsValidated.push({
				from: fromValidated.string,
				to: toValidated.string,
			});

			if (!fromValidated.valid) {
				new Notice(
					`Error: "${rule.from}" is not valid: "${fromValidated.string}". Stopping before editing the text.`,
					noticeTimeoutSeconds,
				);
				allValid = false;
			}
			if (toValidated.valid === false) {
				new Notice(
					`Error: "${rule.to}" is not valid: "${toValidated.string}". Stopping before editing the text.`,
					noticeTimeoutSeconds,
				);
				allValid = false;
			}
		}

		const cursorStartRegex = validateRuleString(pattern.cursorRegexStart);
		const cursorEndRegex = validateRuleString(pattern.cursorRegexEnd);

		if (cursorStartRegex.valid !== true) {
			new Notice(
				`Error: "${pattern.cursorRegexStart}" is not valid: "${cursorStartRegex.string}". Stopping before editing the text.`,
				noticeTimeoutSeconds,
			);
			allValid = false;
		}

		if (cursorEndRegex.valid !== true) {
			new Notice(
				`Error: "${pattern.cursorRegexEnd}" is not valid: "${cursorEndRegex.string}". Stopping before editing the text.`,
				noticeTimeoutSeconds,
			);
			allValid = false;
		}

		if (allValid !== true) {
			return; // Stop the function prematurely
		}

		const transaction: EditorTransaction = {
			changes: [],
		};

		let finalCursorPositions: EditorRangeOrCaret;

		if (mode === 'lines') {
			const updatedLines: string[] = [];
			for (
				let lineNumber = minLine;
				lineNumber <= maxLine;
				lineNumber++
			) {
				let line = editor.getLine(lineNumber);
				pattern.rules.forEach((rule, ruleIndex) => {
					if (rule.disabled === true) {
						// Skip the rule if it's disabled:
						return;
					}
					line = line.replace(
						new RegExp(
							allRuleStringsValidated[ruleIndex].from,
							`u${rule.caseInsensitive ? 'i' : ''}${
								rule.global ? 'g' : ''
							}${rule.multiline ? 'm' : ''}${
								rule.sticky ? 's' : ''
							}`,
						),
						allRuleStringsValidated[ruleIndex].to,
					);
				});
				updatedLines.push(line);
			}
			transaction.changes?.push({
				from: { line: minLine, ch: 0 },
				to: {
					line: maxLine,
					ch: editor.getLine(maxLine).length,
				},
				text: updatedLines.join('\n'),
			});

			finalCursorPositions = calculateCursorPoints(
				minLine,
				updatedLines,
				cursorStartRegex,
				cursorEndRegex,
			);
		}

		if (mode === 'selection') {
			let updatedSelection = editor.getSelection();
			pattern.rules.forEach((rule, ruleIndex) => {
				updatedSelection = updatedSelection.replace(
					new RegExp(
						allRuleStringsValidated[ruleIndex].from,
						`u${rule.caseInsensitive ? 'i' : ''}${
							rule.global ? 'g' : ''
						}${rule.multiline ? 'm' : ''}${rule.sticky ? 's' : ''}`,
					),
					allRuleStringsValidated[ruleIndex].to,
				);
			});
			transaction.replaceSelection = updatedSelection;

			const newContentSplit = updatedSelection.split('\n');

			finalCursorPositions = calculateCursorPoints(
				minLine,
				newContentSplit,
				cursorStartRegex,
				cursorEndRegex,
			);

			if (finalCursorPositions.to) {
				finalCursorPositions.to = {
					...finalCursorPositions.to,
					ch:
						finalCursorPositions.to.ch +
						(cursorFrom.line === cursorTo.line ? cursorFrom.ch : 0),
				};
			}
		}

		if (mode === 'document') {
			const editorLineCount = editor.lineCount();
			const fullDocumentSelector = {
				from: { line: 0, ch: 0 },
				to: {
					line: editorLineCount - 1,
					ch: editor.getLine(editorLineCount - 1).length,
				},
			};
			let updatedDocument = editor.getRange(
				fullDocumentSelector.from,
				fullDocumentSelector.to,
			);
			pattern.rules.forEach((rule, ruleIndex) => {
				updatedDocument = updatedDocument.replace(
					new RegExp(
						allRuleStringsValidated[ruleIndex].from,
						`u${rule.caseInsensitive ? 'i' : ''}${
							rule.global ? 'g' : ''
						}${rule.multiline ? 'm' : ''}${rule.sticky ? 's' : ''}`,
					),
					allRuleStringsValidated[ruleIndex].to,
				);
			});
			transaction.changes?.push({
				...fullDocumentSelector,
				text: updatedDocument,
			});
			const newContentSplit = updatedDocument.split('\n');

			finalCursorPositions = calculateCursorPoints(
				0,
				newContentSplit,
				cursorStartRegex,
				cursorEndRegex,
			);
		}

		editor.transaction(transaction);

		editor.setSelection(finalCursorPositions.from, finalCursorPositions.to);
	};

	// Need to create a new instance every time, as cursor can change.
	const patternModal = new PatternModal({
		app,
		onChooseItem,
		command,
	});
	patternModal.open();
};
