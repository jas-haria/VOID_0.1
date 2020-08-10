export interface QuoraQuestion {
    id: number;
    question_text: string;
    question_url: string;
    division_id: number;
    asked_on: Date;
    evaluated: boolean;
}