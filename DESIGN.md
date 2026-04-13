# DESIGN

## 按照上节课感想对作业一源码进行重构

1. 对于输入的变量，要么进行合法性检查，要么通过注释进行规定
2. 对于输入的move，对它的合法性进行检查
3. 将大量浅拷贝改为深拷贝，防止绕过对象本身对数组进行修改
4. 重构代码为4个脚本，更清晰可读性更高


## 接入前端，使数独运行调用自己的领域对象

我们采用方案二，采用可订阅可取消订阅的对象

我们主要调整`src/node_modules/@sudoku/stores/grid.js`的内容。
1. 在`create_grid`时，调用自己的工具函数，采用深拷贝创建网格。创建`Game`对象
2. 初始化`Game`对象的`difficulty`,`canredo`...性质，最后**返回对象的subscribe**，为了即时更新
3. 修改`Usergrid`，接入`Game`对象的接口

紧接着，调整`src/node_modules/@sudoku/game.js`，创建撤回和重做的功能。

再者，调整`src/components/Controls/ActionBar/Actions.svelte`，将撤回和重做按钮的禁用条件从“暂停”改为“暂停且可以禁用或重做”

完成✅


## 领域对象如何被前端消费

我们采用的是“订阅 / 取消订阅”的方式，而不是让组件直接操作领域对象内部字段。

### 1. View 层直接消费什么

View 层消费的是 `src/node_modules/@sudoku/stores/grid.js` 暴露出来的 store，而不是直接消费 `Game` 或 `Sudoku` 的内部状态。

这个 store 作为适配层，内部持有自己的 `Game` 对象，并把领域对象变化后的快照同步给 Svelte。

### 2. View 层拿到什么数据

前端界面真正使用的数据主要有这些：

1. `grid`：初始题面，用来区分固定格和可编辑格
2. `userGrid`：当前局面，用来渲染界面
3. `invalidCells`：冲突格，用来高亮错误输入
4. `canUndo`、`canRedo`：撤销/重做按钮是否可用

### 3. 用户操作如何进入领域对象

用户在界面中的操作不会直接改数组，而是先进入适配层，再由适配层调用领域对象接口。

1. 开始游戏时，`grid.generate(...)` 或 `grid.decodeSencode(...)` 会创建新的 `Game` 和 `Sudoku`
2. 输入数字时，`userGrid.set(pos, value)` 最终会调用 `currentGame.guess(...)`
3. 使用提示时，`userGrid.applyHint(pos)` 最终会调用 `currentGame.guess(...)`
4. 撤销和重做时，按钮会调用 `undoMove()` / `redoMove()`，再转到 `currentGame.undo()` / `currentGame.redo()`

### 4. 领域对象变化后，Svelte 为什么会更新

核心原因是：适配层在领域对象变化后，会主动执行 store 的 `set(...)`。

当前实现里，`grid.js` 会在状态变化后调用：

1. `gameGrid.set(currentGame.getSudoku().getGrid())`
2. `canUndo.set(currentGame.canUndo())`
3. `canRedo.set(currentGame.canRedo())`

`userGrid` 再通过订阅 `gameGrid` 获取新的数组快照。

只要 store 发生了新的 `set`，Svelte 的 `$store` 就会触发界面刷新。


## 为什么这种方式适合 Svelte 3

本次作业要求的是 Svelte 3 风格的响应式机制，所以我们没有把领域对象做成 reactive class，而是采用 store 方案。

### 1. 依赖的响应式机制

1. `writable` / `derived` store
2. 组件中的 `$store` 语法
3. 适配层内部的订阅回调

### 2. 为什么不能直接修改对象内部字段

如果组件直接改 `Game` 或 `Sudoku` 的内部字段，会有两个问题：

1. 可能绕过领域规则，比如固定格不能修改、错误输入不能通过校验
2. 可能没有触发 store 更新，导致数据变了但界面不刷新

所以我们让领域对象只负责规则和状态演进，让 store 负责通知前端刷新。


## 相比 HW1 的改进

和 HW1 相比，这次不是“领域对象只在测试里存在”，而是把它真正放进了 UI 主流程。

### 1. 改进点

1. 输入逻辑从组件中移到领域对象
2. Undo / Redo 从按钮逻辑中移到领域对象
3. UI 通过订阅 store 自动更新，不再自己维护一份独立的业务状态

### 2. 这次设计的边界

1. 领域层负责规则、历史、序列化
2. 适配层负责订阅、取消订阅和状态同步
3. View 层只负责展示和触发事件

### 3. trade-off

这种设计比直接操作数组多了一层适配，但换来的是更清晰的职责边界，也更符合“领域对象真正被前端消费”的要求。


## 可以回答老师的问题

1. View 层直接消费的是谁：消费 store，不是直接消费领域对象内部字段
2. 为什么 UI 会刷新：因为适配层在状态变化后主动 `set(...)`，触发 `$store`
3. 响应式边界在哪里：边界在适配层，领域层不直接暴露给组件
4. 哪些状态可见：题面、当前局面、冲突格、Undo/Redo 能力位
5. 如果直接 mutate 会怎样：可能破坏领域规则，也可能不刷新界面