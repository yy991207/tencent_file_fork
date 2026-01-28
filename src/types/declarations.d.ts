/**
 * Less 模块类型声明
 * 使 TypeScript 能够识别 .less 文件的导入
 */
declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * 图片文件类型声明
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
