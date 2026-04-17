# con-oo-IMWLGDHGNC - Review

## Review 结论

当前实现已经把 `Game`/`Sudoku` 接进了真实的 Svelte 游戏流程，开始游戏、输入、Undo/Redo 也基本都经过领域对象而不是直接改数组；但整体仍属于“接上了，但设计没有完全收拢”的状态。最突出的问题不是有没有类，而是领域规则仍有一部分散落在 Svelte store 中，同时 `Sudoku.guess()` 的状态原子性和 `Game` 的历史语义存在实质缺陷，这会直接影响数独业务正确性与界面一致性。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | fair |
| OOD | fair |

## 缺点

### 1. 非法猜测会破坏 Sudoku 内部状态的原子性

- 严重程度：core
- 位置：src/domain/Sudoku.js:52-66
- 原因：`guess()` 先把当前格子清成 `EMPTY`，再做合法性校验；一旦校验失败直接抛错，旧值不会恢复。这样非法输入不仅没有被“拒绝且不生效”，反而会悄悄改坏领域对象状态。结合 `grid.guess()` 的 `try/catch` 吞错逻辑，这还会造成 UI 未同步但领域对象已被改写，Undo/Redo 历史也不会记录这次破坏性变化。

### 2. 笔记模式和空操作也会污染正式走子历史

- 严重程度：core
- 位置：src/components/Controls/Keyboard.svelte:12-24, src/domain/Game.js:23-35
- 原因：笔记模式下只是维护 candidates，却仍然调用 `userGrid.set($cursor, 0)`；而 `Game.guess()` 不论值是否变化都会无条件写入 history 并清空 redo。结果是“记笔记”“对空格再清空一次”这类非正式走子也会占用 Undo/Redo，直接破坏数独游戏的业务语义。

### 3. 加载自定义棋局时没有校验初始 givens 是否满足数独规则

- 严重程度：major
- 位置：src/domain/Sudoku.js:17-24, src/node_modules/@sudoku/stores/grid.js:39-57
- 原因：`Sudoku` 构造时只校验 9x9 形状和值范围，没有验证初始盘面是否存在行/列/宫冲突；`startCustom()`/`decodeSencode()` 因而可以创建一局固定数字彼此冲突的棋。由于这些 givens 又会被标记为 fixed，UI 实际上可能进入一个先天不可解、且玩家无法修正的局面。

### 4. 关键数独规则仍主要放在 Svelte store，而不是领域对象中

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:142-186, src/node_modules/@sudoku/stores/game.js:7-18
- 原因：`invalidCells` 和 `gameWon` 都在 store 层基于二维数组重新推导，说明“冲突判定”“胜利判定”这类核心业务规则没有真正收口到 `Sudoku`/`Game`。这削弱了 OOP/OOD：View 适配层不只是消费领域对象，而是在补写领域逻辑，职责边界仍然偏散。

### 5. 事件绑定写法不符合 Svelte 惯例，选择格子的交互存在风险

- 严重程度：major
- 位置：src/components/Board/Cell.svelte:39
- 原因：`on:click={cursor.set(cellX - 1, cellY - 1)}` 不是传递回调，而是把方法调用结果放进事件绑定。按 Svelte 3 的常规语义，这会在渲染时就执行 `cursor.set(...)`，并把返回值当作 handler，容易导致选中逻辑在错误时机触发，甚至点击本身没有有效处理函数。

### 6. getCell 关闭了索引校验，公共 API 的防御性不一致

- 严重程度：minor
- 位置：src/domain/Sudoku.js:38-43
- 原因：`validateMove()`、构造函数等入口都在认真校验输入，但 `getCell()` 的边界检查被整段注释掉了。这样一来，越界访问时可能返回 `undefined` 或抛出底层数组错误，API 行为不统一，也不利于领域层保持清晰契约。

## 优点

### 1. 领域不变量被集中到公共校验函数

- 位置：src/domain/common.js:23-74
- 原因：9x9 结构、fixed mask、move、history entry 都有统一校验入口，避免了校验逻辑散落在多个类里，属于比较整洁的基础设施层设计。

### 2. 克隆与序列化保留了 fixed mask，恢复结果可预测

- 位置：src/domain/Sudoku.js:69-81
- 原因：`clone()` 和 `toJSON()` 都把 `fixed` 一起复制/外表化，避免了反序列化后“哪些格子可编辑”发生漂移，这对 Undo/Redo 和存档恢复都很重要。

### 3. Game 采用差量历史而不是整盘快照

- 位置：src/domain/Game.js:8-17, src/domain/Game.js:23-35, src/domain/Game.js:70-75
- 原因：`history`/`redoList` 只保存 move 与 `previousValue`，比整盘存储更符合 Undo/Redo 的职责，也更容易序列化，说明作者已经在做一定程度的 OOD 拆分。

### 4. 存在明确的 Svelte 适配层，领域对象没有只停留在测试里

- 位置：src/node_modules/@sudoku/stores/grid.js:25-43, src/node_modules/@sudoku/stores/grid.js:68-103
- 原因：`createGrid()` 私有持有 `currentGame`，并通过 store 暴露当前局面和操作方法；用户输入、提示、Undo/Redo 都会先调用 `Game`，再 `syncFromDomain()` 推到界面，这符合作业要求里推荐的 store adapter 方向。

### 5. 开始游戏与撤销/重做已经接入真实界面流程

- 位置：src/node_modules/@sudoku/game.js:13-34, src/node_modules/@sudoku/game.js:52-57, src/components/Controls/ActionBar/Actions.svelte:27-41, src/components/Modal/Types/Welcome.svelte:16-23
- 原因：开始一局、自定义载入、Undo、Redo 都通过统一门面进入 store/domain 调用链，而不是在组件里直接操作二维数组；从接入角度看，主流程已经不是“测试可用、UI 不用”的状态。

## 补充说明

- 本次结论仅基于静态阅读 `src/domain/*` 及其关联的 Svelte 接入文件；按要求未运行测试，也未实际启动页面验证交互。
- 关于 `Cell.svelte` 的事件绑定、笔记模式污染 Undo/Redo、以及非法输入后领域状态与 UI 可能失同步等结论，均来自对 Svelte 3 语义与调用链的静态推导。
- 本次没有扩展审查无关目录，也没有评估外部数独生成器/求解器库本身的正确性。
