export enum QuoraQuestionAccountAction {
    ANSWERED = "ANSWERED",
    ASKED = "ASKED",
    ASSIGNED = "ASSIGNED",
    EVALUATED = "EVALUATED",
    REQUESTED = "REQUESTED",
    PASSED = "PASSED",
    NEW = "NEW"  //for unassigned questions. Not persisted in db
}