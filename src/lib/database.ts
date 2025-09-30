import fs from 'fs';
import path from 'path';

// 数据目录路径
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const DEPLOYMENT_STATUS_FILE = path.join(DATA_DIR, 'deployment_status.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 读取JSON文件
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

// 写入JSON文件
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// 数据库操作的基础类型
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  image_url?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name?: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  deployed: boolean;
  subdomain?: string;
  landing_page_data?: any; // JSON对象
  created_at: string;
  updated_at: string;
}

export interface DeploymentStatus {
  project_id: string;
  status: 'deploying' | 'completed' | 'failed';
  subdomain?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

class JsonDatabase {
  private static instance: JsonDatabase;

  private constructor() {
    ensureDataDir();
  }

  public static getInstance(): JsonDatabase {
    if (!JsonDatabase.instance) {
      JsonDatabase.instance = new JsonDatabase();
    }
    return JsonDatabase.instance;
  }

  // 用户操作
  getUsers(): User[] {
    return readJsonFile<User[]>(USERS_FILE, []);
  }

  saveUsers(users: User[]): boolean {
    return writeJsonFile(USERS_FILE, users);
  }

  addUser(user: User): boolean {
    const users = this.getUsers();
    users.push(user);
    return this.saveUsers(users);
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    return this.saveUsers(users);
  }

  findUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  // 项目操作
  getProjects(): Project[] {
    return readJsonFile<Project[]>(PROJECTS_FILE, []);
  }

  saveProjects(projects: Project[]): boolean {
    return writeJsonFile(PROJECTS_FILE, projects);
  }

  addProject(project: Project): boolean {
    const projects = this.getProjects();
    projects.push(project);
    return this.saveProjects(projects);
  }

  updateProject(projectId: string, updates: Partial<Project>): boolean {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return false;
    
    projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
    return this.saveProjects(projects);
  }

  findProjectById(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  findUserProjects(userId: string): Project[] {
    const projects = this.getProjects();
    return projects.filter(p => p.user_id === userId).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  deleteProject(projectId: string, userId: string): boolean {
    const projects = this.getProjects();
    const initialLength = projects.length;
    const filteredProjects = projects.filter(p => !(p.id === projectId && p.user_id === userId));
    
    if (filteredProjects.length === initialLength) return false;
    
    return this.saveProjects(filteredProjects);
  }

  // 部署状态操作
  getDeploymentStatuses(): DeploymentStatus[] {
    return readJsonFile<DeploymentStatus[]>(DEPLOYMENT_STATUS_FILE, []);
  }

  saveDeploymentStatuses(statuses: DeploymentStatus[]): boolean {
    return writeJsonFile(DEPLOYMENT_STATUS_FILE, statuses);
  }

  setDeploymentStatus(status: DeploymentStatus): boolean {
    const statuses = this.getDeploymentStatuses();
    const index = statuses.findIndex(s => s.project_id === status.project_id);
    
    if (index >= 0) {
      statuses[index] = { ...status, updated_at: new Date().toISOString() };
    } else {
      statuses.push(status);
    }
    
    return this.saveDeploymentStatuses(statuses);
  }

  getDeploymentStatus(projectId: string): DeploymentStatus | null {
    const statuses = this.getDeploymentStatuses();
    return statuses.find(s => s.project_id === projectId) || null;
  }

  deleteDeploymentStatus(projectId: string): boolean {
    const statuses = this.getDeploymentStatuses();
    const filteredStatuses = statuses.filter(s => s.project_id !== projectId);
    return this.saveDeploymentStatuses(filteredStatuses);
  }
}

export const db = JsonDatabase.getInstance();