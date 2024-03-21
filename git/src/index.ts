import { CPMContext, ActionInput, ActionOutput, CPMPlugin } from '@cloudimpl-inc/cpm';
import * as path from 'path';
import * as fs from 'fs';
import {executeShellCommand} from "@cloudimpl-inc/cpm/dist/util";

const gitPlugin: CPMPlugin = {
    name: 'git',
    actions: {
        'repo clone': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { url } = input.args;
            try {
                const [org, repo] = url.split('/').slice(-2).map((segment: string) => segment.replace('.git', ''));
                const repoDir = path.join(ctx.config.rootDir, org, repo);

                // Check if the repository is already cloned
                if (fs.existsSync(repoDir)) {
                    console.log(`Repository already exists at ${repoDir}. Skipping clone step.`);
                    return { org, repo, path: repoDir };
                }

                // Clone the repository
                // @ts-ignore
                await executeShellCommand(`git clone ${url} ${repoDir}`);
                console.log(`Repository cloned successfully to ${repoDir}`);
                return { org, repo, path: repoDir };
            } catch (error: any) {
                console.error('Error cloning repository:', error.message);
                return { error: 'Failed to clone repository' };
            }
        },
        'repo checkout': async (ctx: CPMContext, input: ActionInput): Promise<ActionOutput> => {
            const { branch } = input.options;
            try {
                // @ts-ignore
                await executeShellCommand(`git fetch && git checkout -b ${branch} || git checkout ${branch}`);
                console.log(`Checked out branch ${branch}`);
                return {};
            } catch (error: any) {
                console.error('Error checking out branch:', error.message);
                return { error: 'Failed to checkout branch' };
            }
        }
    }
};

export default function createGitPlugin(ctx: CPMContext): CPMPlugin {
    return gitPlugin;
}
