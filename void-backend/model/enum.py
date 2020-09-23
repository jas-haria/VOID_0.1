import enum


class TimePeriod(enum.Enum):
    DAY = "day"
    WEEK = "week"
    MONTH ="month"

    def __str__(self):
        return str(self.value)

class QuoraQuestionAccountAction(enum.Enum):
    ANSWERED = "ANSWERED"
    ASKED = "ASKED"
    EVALUATED = "EVALUATED"
    REQUESTED = "REQUESTED"
    ASSIGNED = "ASSIGNED"
    PASSED = "PASSED"
    NEW = "NEW" #not persisted in db. for new questions that are unassigned

    def __str__(self):
        return str(self.value)
