interface TextNode {
  readonly type: 'text';
  readonly text: string;
}

interface NewLineNode {
  readonly type: 'newline';
}

interface RefLinkNode {
  readonly type: 'reflink';
  readonly postID: number;
  readonly threadID?: number;
}

interface LinkNode {
  readonly type: 'link';
  readonly text: string;
  readonly url: string;
  readonly icon?: string;
}

interface DiceNode {
  readonly type: 'dice';
  readonly count: number;
  readonly max: number;
  readonly result?: number[];
}

interface StyleNode {
  readonly type: 'style';
  readonly style: Style;
  readonly value?: string;
  readonly children: Node[];
}

export type Node = TextNode | NewLineNode | RefLinkNode | LinkNode | DiceNode | StyleNode;

export type Style =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'superscript'
  | 'subscript'
  | 'spoiler'
  | 'code'
  | 'color'
  | 'size'
  | 'quote';
