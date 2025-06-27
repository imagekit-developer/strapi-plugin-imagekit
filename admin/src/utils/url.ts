export function removeTrailingSlash(str: string) {
  if (typeof str == 'string' && str[str.length - 1] == '/') {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

export function removeLeadingSlash(str: string) {
  if (typeof str == 'string' && str[0] == '/') {
    str = str.slice(1);
  }
  return str;
}
