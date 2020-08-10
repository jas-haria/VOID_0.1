import enum


class TimePeriod(enum.Enum):
    DAY = "day"
    WEEK = "week"
    MONTH ="month"

    def __str__(self):
        return str(self.value)
