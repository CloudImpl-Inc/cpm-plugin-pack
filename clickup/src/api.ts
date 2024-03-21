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

interface List {
    id: string;
    name: string;
    // Add other list properties as needed
}

interface Task {
    id: string;
    name: string;
    description: string;
    status: {
        id: string
        status: string
    }
    // Add other task properties as needed
}

interface User {
    id: string;
    username: string;
    // Add other user properties as needed
}

interface TaskUpdate {
    status: string;
    // Add other fields you want to update as needed
}

export class ClickUpAPI {
    private apiKey: string;
    private user: User | undefined;
    private apiUrl = 'https://api.clickup.com/api/v2/';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getCurrentUser(): Promise<User> {
        if (this.user) {
            return this.user;
        }

        const url = `${this.apiUrl}user`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            const u = response.data.user;
            this.user = u;
            return u;
        } catch (error: any) {
            console.error('Error getting current user:', error.response.data);
            throw new Error('Failed to get current user');
        }
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

    async getListsInSpace(spaceId: string): Promise<List[]> {
        const url = `${this.apiUrl}space/${spaceId}/list`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            }
        };

        try {
            const response = await axios.get(url, config);
            return response.data.lists;
        } catch (error: any) {
            console.error('Error getting lists in space:', error.response.data);
            throw new Error('Failed to get lists in space');
        }
    }

    async getTasksInList(listId: string, assignee?: string): Promise<Task[]> {
        let url = `${this.apiUrl}list/${listId}/task`;

        const params = (assignee)
            ? {assignees: [assignee]}
            : {}

        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey
            },
            params: params
        };

        try {
            const response = await axios.get(url, config);
            return response.data.tasks;
        } catch (error: any) {
            console.error('Error getting tasks in list:', error.response.data);
            throw new Error('Failed to get tasks in list');
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

    async updateTask(taskId: string, update: TaskUpdate): Promise<void> {
        const url = `${this.apiUrl}task/${taskId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            }
        };

        try {
            await axios.put(url, update, config);
        } catch (error: any) {
            console.error('Error updating task status:', error.response.data);
            throw new Error('Failed to update task status');
        }
    }
}