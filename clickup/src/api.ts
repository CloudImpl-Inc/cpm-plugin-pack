import axios, {AxiosRequestConfig} from "axios";

interface Workspace {
    id: string;
    name: string;
    // Add other workspace properties as needed
}

interface Space {
    id: string;
    name: string;
    // Add other space properties as needed
}

interface Folder {
    id: string;
    name: string;
    // Add other folder properties as needed
}

interface Task {
    id: string;
    name: string;
    description: string;
    // Add other task properties as needed
}

export class ClickUpAPI {
    private apiKey: string;
    private apiUrl = 'https://api.clickup.com/api/v2/';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async listWorkspaces(): Promise<Workspace[]> {
        const url = `${this.apiUrl}team`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data.teams;
        } catch (error: any) {
            console.error('Error listing workspaces:', error.response.data);
            throw new Error('Failed to list workspaces');
        }
    }

    async listSpacesInWorkspace(workspaceId: string): Promise<Space[]> {
        const url = `${this.apiUrl}team/${workspaceId}/space`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data.spaces;
        } catch (error: any) {
            console.error('Error listing spaces in workspace:', error.response.data);
            throw new Error('Failed to list spaces in workspace');
        }
    }

    async listFolders(workspaceId: string): Promise<Folder[]> {
        const url = `${this.apiUrl}team/${workspaceId}/folder`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data.folders;
        } catch (error: any) {
            console.error('Error listing folders:', error.response.data);
            throw new Error('Failed to list folders');
        }
    }

    async listTasks(folderId: string): Promise<Task[]> {
        const url = `${this.apiUrl}folder/${folderId}/task`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data.tasks;
        } catch (error: any) {
            console.error('Error listing tasks:', error.response.data);
            throw new Error('Failed to list tasks');
        }
    }

    async getTask(taskId: string): Promise<Task> {
        const url = `${this.apiUrl}task/${taskId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data;
        } catch (error: any) {
            console.error('Error getting task:', error.response.data);
            throw new Error('Failed to get task');
        }
    }

    async updateTaskStatus(taskId: string, status: string): Promise<void> {
        const url = `${this.apiUrl}task/${taskId}/status`;
        const data = { status };
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            }
        };

        try {
            await axios.put(url, data, config);
        } catch (error: any) {
            console.error('Error updating task status:', error.response.data);
            throw new Error('Failed to update task status');
        }
    }
}