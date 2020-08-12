export enum QuoraQuestionAccountAction {
    ANSWERED = "ANSWERED",
    ASKED = "ASKED",
    EVALUATED = "EVALUATED",
    REQUESTED = "REQUESTED",
    NEW = "NEW"  //for unassigned questions. Not persisted in db
}