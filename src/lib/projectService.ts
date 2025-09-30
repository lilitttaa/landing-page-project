import { db, Project, DeploymentStatus } from './database';

export class ProjectService {
  static createProject(userId: string, description: string): Project {
    try {
      const newProject: Project = {
        id: Date.now().toString(),
        user_id: userId,
        description: description.trim(),
        status: 'generating',
        deployed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const success = db.addProject(newProject);
      if (!success) {
        throw new Error('Failed to create project');
      }
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static getUserProjects(userId: string): Project[] {
    try {
      return db.findUserProjects(userId);
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  static getProjectById(projectId: string): Project | null {
    try {
      return db.findProjectById(projectId);
    } catch (error) {
      console.error('Error getting project by id:', error);
      return null;
    }
  }

  static getUserProject(projectId: string, userId: string): Project | null {
    try {
      const project = db.findProjectById(projectId);
      if (project && project.user_id === userId) {
        return project;
      }
      return null;
    } catch (error) {
      console.error('Error getting user project:', error);
      return null;
    }
  }

  static updateProject(projectId: string, updates: Partial<Project>): boolean {
    try {
      return db.updateProject(projectId, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  }

  static updateProjectStatus(
    projectId: string, 
    status: 'generating' | 'completed' | 'failed',
    additionalData?: {
      name?: string;
      landing_page_data?: any;
      deployed?: boolean;
      subdomain?: string;
    }
  ): boolean {
    try {
      const updates: Partial<Project> = { status };
      
      if (additionalData) {
        if (additionalData.name) updates.name = additionalData.name;
        if (additionalData.landing_page_data) {
          updates.landing_page_data = additionalData.landing_page_data;
        }
        if (additionalData.deployed !== undefined) {
          updates.deployed = additionalData.deployed;
        }
        if (additionalData.subdomain) updates.subdomain = additionalData.subdomain;
      }

      return this.updateProject(projectId, updates);
    } catch (error) {
      console.error('Error updating project status:', error);
      return false;
    }
  }

  // 部署状态管理
  static setDeploymentStatus(
    projectId: string, 
    status: 'deploying' | 'completed' | 'failed',
    subdomain?: string,
    errorMessage?: string
  ): boolean {
    try {
      const deploymentStatus: DeploymentStatus = {
        project_id: projectId,
        status,
        subdomain,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return db.setDeploymentStatus(deploymentStatus);
    } catch (error) {
      console.error('Error setting deployment status:', error);
      return false;
    }
  }

  static getDeploymentStatus(projectId: string): DeploymentStatus | null {
    try {
      return db.getDeploymentStatus(projectId);
    } catch (error) {
      console.error('Error getting deployment status:', error);
      return null;
    }
  }

  static deleteProject(projectId: string, userId: string): boolean {
    try {
      // 删除部署状态
      db.deleteDeploymentStatus(projectId);
      // 删除项目
      return db.deleteProject(projectId, userId);
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
}