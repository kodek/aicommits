import { execSync } from 'child_process';
import type { CommitType } from './config.js';

const commitTypeFormats: Record<CommitType, string> = {
	// '': '<commit message>',
	// If we haven't specified plain style, then we ask the AI to guess which style to use
	// We could also call this commit type 'guess', or we could call the default commit type 'plain'
	'': '<commit message>, or if it fits with previous commits, then use the conventional style: <type>(<optional scope>): <commit message>',
	conventional: '<type>(<optional scope>): <commit message>',
};
const specifyCommitFormat = (type: CommitType) => `The output response must be in format:\n${commitTypeFormats[type]}`;

function getRecentCommitMessages(): string[] {
	const command = 'git log --pretty=format:%s -n 25';
	const result = execSync(command).toString();
	return result.split('\n').filter(Boolean);
}

function recentCommitMessages() {
	return `Here are some recent commit messages, which you can use as a guideline:\n${getRecentCommitMessages().join('\n')}`;
}

const commitTypes: Record<CommitType, string> = {
	'': '',

	/**
	 * References:
	 * Commitlint:
	 * https://github.com/conventional-changelog/commitlint/blob/18fbed7ea86ac0ec9d5449b4979b762ec4305a92/%40commitlint/config-conventional/index.js#L40-L100
	 *
	 * Conventional Changelog:
	 * https://github.com/conventional-changelog/conventional-changelog/blob/d0e5d5926c8addba74bc962553dd8bcfba90e228/packages/conventional-changelog-conventionalcommits/writer-opts.js#L182-L193
	 */
	conventional: `Choose a type from the type-to-description JSON below that best describes the git diff:\n${
		JSON.stringify({
			docs: 'Documentation only changes',
			style: 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
			refactor: 'A code change that neither fixes a bug, nor adds a feature, nor changes what the code does',
			perf: 'A code change that improves performance',
			test: 'Adding missing tests or correcting existing tests',
			build: 'Changes that affect the build system or external dependencies',
			ci: 'Changes to our CI configuration files and scripts',
			chore: "Other changes that don't modify src or test files",
			revert: 'Reverts a previous commit',
			feat: 'A new feature or an improvement to the existing code',
			fix: 'A bug fix',
		}, null, 2)
	}`,
};

export const generatePrompt = (
	locale: string,
	maxLength: number,
	type: CommitType,
) => [
	'Generate a concise git commit message written in present tense for the following code diff with the given specifications below:',
	`Message language: ${locale}`,
	`Commit message must be a maximum of ${maxLength} characters.`,
	'Exclude anything unnecessary such as translation. Your entire response will be passed directly into git commit.',
	'If possible, instead of simply describing what code changed, try to infer and describe why the developer wanted to changed it.',
	commitTypes[type || 'conventional'],
	specifyCommitFormat(type),
	recentCommitMessages(),
].filter(Boolean).join('\n');
