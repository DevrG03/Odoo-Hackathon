export interface ESGPolicy { id: number; title: string; description: string; version: string; effective_date: string; document_url: string | null }
export interface PolicyAcknowledgement { id: number; policy_id: number; employee_id: number; status: string; acknowledged_date: string | null }
export interface Audit { id: number; title: string; auditor: string; date: string; status: string }
export interface ComplianceIssue { id: number; audit_id: number; severity: string; description: string; owner_id: number; due_date: string; status: string }
