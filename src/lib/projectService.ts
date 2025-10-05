import { db, Project, DeploymentStatus } from './database';
import { ComponentDataValidator } from './componentDataValidator';

export class ProjectService {
  private static validator = new ComponentDataValidator();

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
      const projects = db.findUserProjects(userId);
      // 为每个项目校验和合并数据
      return projects.map(project => this.validateAndMergeProjectData(project));
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  static getProjectById(projectId: string): Project | null {
    try {
      const project = db.findProjectById(projectId);
      if (!project) return null;
      
      // 校验和合并数据
      return this.validateAndMergeProjectData(project);
    } catch (error) {
      console.error('Error getting project by id:', error);
      return null;
    }
  }

  static getUserProject(projectId: string, userId: string): Project | null {
    try {
      const project = db.findProjectById(projectId);
      if (project && project.user_id === userId) {
        return this.validateAndMergeProjectData(project);
      }
      return null;
    } catch (error) {
      console.error('Error getting user project:', error);
      return null;
    }
  }

  static updateProject(projectId: string, updates: Partial<Project>): boolean {
    try {
      // 如果更新包含 landing_page_data，先进行校验
      if (updates.landing_page_data) {
        updates.landing_page_data = this.validateAndMergeLandingPageData(updates.landing_page_data);
      }
      
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
          // 校验和合并 landing page data
          updates.landing_page_data = this.validateAndMergeLandingPageData(additionalData.landing_page_data);
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

  /**
   * 校验和合并项目的 landing page data
   */
  private static validateAndMergeProjectData(project: Project): Project {
    if (!project.landing_page_data) {
      return project;
    }

    try {
      const validatedData = this.validateAndMergeLandingPageData(project.landing_page_data);
      return {
        ...project,
        landing_page_data: validatedData
      };
    } catch (error) {
      console.warn(`Failed to validate project ${project.id} data:`, error);
      return project; // 返回原始数据作为后备
    }
  }

  /**
   * 校验和合并 landing page data 中每个组件的数据
   */
  private static validateAndMergeLandingPageData(landingPageData: any): any {
    if (!landingPageData || !landingPageData.sitemap || !landingPageData.blocks || !landingPageData.block_contents) {
      return landingPageData;
    }

    const validatedData = JSON.parse(JSON.stringify(landingPageData)); // 深拷贝

    // 遍历每个 block 并校验其内容
    for (const blockId of validatedData.sitemap) {
      const block = validatedData.blocks[blockId];
      if (!block) continue;

      const contentId = block.content;
      const content = validatedData.block_contents[contentId];
      if (!content) continue;

      try {
        // 使用组件名（subtype）进行校验
        const componentName = block.subtype;
        
        // 校验数据
        const validationResult = this.validator.validateComponentData(componentName, content);
        
        if (!validationResult.isValid && process.env.NODE_ENV === 'development') {
          console.warn(`Validation errors for ${componentName} in block ${blockId}:`, validationResult.errors);
        }

        // 合并默认值
        validatedData.block_contents[contentId] = this.validator.mergeWithDefaults(componentName, content);
        
      } catch (error) {
        console.warn(`Failed to validate component ${block.subtype} in block ${blockId}:`, error);
        // 保持原始内容
      }
    }

    return validatedData;
  }
}