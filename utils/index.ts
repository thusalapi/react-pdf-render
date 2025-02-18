export const getAdjustedPageAndPosition = (
  y: number,
  page: number,
  pageHeight: number,
  fieldHeight: number,
  numPages: number
): { page: number; y: number } => {
  let adjustedPage = page;
  let adjustedY = y;

  if (y < 0 && page > 1) {
    adjustedPage = page - 1;
    adjustedY = pageHeight - fieldHeight / 2;
  } else if (y + fieldHeight > pageHeight && page < numPages) {
    adjustedPage = page + 1;
    adjustedY = fieldHeight / 2;
  }

  return { page: adjustedPage, y: adjustedY };
};
