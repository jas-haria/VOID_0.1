import { QuoraAskedQuestionArchieveStats } from "./quora-asked-question-archieve-stats.model";

export class QuoraArchievedQuestionResponse{
    id: number;
    question_text: string;
    question_url: string;
    answered_account_ids: number[];
    asked_account_id: number;
    asked_question_stats: QuoraAskedQuestionArchieveStats;
}