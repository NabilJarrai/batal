// Assessment templates: a titled set of skills assigned to a group, deciding
// what that group's players are assessed on.
//
// Not the same as an Assessment, which is one player's scored result. The
// template is the blueprint; editing it never rewrites recorded assessments.
//
// Templates carry no age or level of their own. Both already describe the
// group, and a template reaches players only by being assigned to one.

import { Skill } from './skills';

export interface AssessmentTemplate {
  id: number;
  title: string;
  description?: string;
  isActive: boolean;
  skills: Skill[];
  skillCount: number;
  /** Groups using this template, so the blast radius of an edit is visible. */
  assignedGroupNames: string[];
  assignedGroupCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentTemplateRequest {
  title: string;
  description?: string;
  /** Skill ids in the order they should be scored. At least one required. */
  skillIds: number[];
  isActive?: boolean;
}
