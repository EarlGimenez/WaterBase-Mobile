export const toTitleCaseInput = (value: string): string => {
  return value.replace(/\S+/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
};
