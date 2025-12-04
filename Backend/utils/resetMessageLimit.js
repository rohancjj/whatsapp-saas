

export const getNextMidnight = () => {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next;
};

export const resetIfNeeded = async (user) => {
  if (!user?.activePlan) return;

  const now = new Date();


  if (!user.activePlan.resetAt) {
    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0);

    user.activePlan.resetAt = nextReset;
    await user.save();
    return;
  }


  if (now > new Date(user.activePlan.resetAt)) {
    user.activePlan.messagesUsedToday = 0;

    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0);

    user.activePlan.resetAt = nextReset;
    await user.save();
  }
};
