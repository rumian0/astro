export default function remarkMark() {
  return (tree: any) => {
    function walk(node: any): any {
      if (node.type === "text" && typeof node.value === "string" && node.value.includes("==")) {
        const parts = node.value.split(/(==[^=]+==)/g);
        if (parts.length <= 1) return node;

        const children: any[] = [];
        for (const part of parts) {
          if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
            const inner = part.slice(2, -2);
            children.push({ type: "html", value: `<mark>${inner}</mark>` });
          } else {
            children.push({ type: "text", value: part });
          }
        }
        return children;
      }

      if (node.children) {
        const newChildren: any[] = [];
        for (const child of node.children) {
          const result = walk(child);
          if (Array.isArray(result)) {
            newChildren.push(...result);
          } else if (result != null) {
            newChildren.push(result);
          }
        }
        node.children = newChildren;
      }

      return node;
    }

    walk(tree);
  };
}
