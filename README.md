# 小小游戏大厅 / Duko

React + TypeScript + Vite 网页小游戏。首页提供游戏入口，Duko 支持关卡选择、点击循环标记、撤销和手动检查答案。

## 开发与检查

```powershell
npm install
npm run dev
npm run build
npm run lint
npm run validate:levels
npm run test:generator
```

## 离线关卡生成器

无需额外依赖，使用项目的 Node.js 运行环境即可。生成器输出候选关卡，不会自动替换游戏中的关卡。

```powershell
npm run generate:levels -- --size 5 --count 4 --seed 20261016
```

默认输出到 `generated/seed-20261016-size-5/`：

- `levels.json`：与 `src/levels/levels.json` 相同的数据结构，包含编号、名称、尺寸、难度和颜色矩阵。
- `report.json`：随机种子、尝试次数、淘汰统计、每关的答案、区域面积与求解搜索节点数。答案按行记录列号，从 0 开始。报告供开发者检查，不导入前端。

此默认种子的样例已生成；再次运行时请选用新的输出目录，以免覆盖样例。

```powershell
npm run generate:levels -- --size 6 --count 8 --seed 42 --output generated/candidates-6x6
npm run generate:levels -- --size 7 --count 4 --seed 99 --max-attempts 200000
npm run generate:levels -- --help
```

参数：

| 参数 | 默认值 | 范围 / 含义 |
| --- | --- | --- |
| `--size` | 5 | 整数 4–7，与当前游戏的七色配色兼容 |
| `--count` | 4 | 整数 1–100 |
| `--seed` | 20261016 | 整数 0–4294967295；相同参数可复现相同输出 |
| `--max-attempts` | 100000 | 整数 1–1000000；达到上限仍未凑齐时退出，不写候选文件 |
| `--output` | 按种子和尺寸命名的目录 | 已有 levels.json 或 report.json 时拒绝覆盖 |

### 生成流程

1. 随机生成列号排列，每行、每列恰好有一面预设旗子。
2. 过滤连续三面旗子构成的斜线，以及几乎占满主对角线或副对角线的答案。
3. 将每面旗子作为一个颜色区域的种子，通过上下左右扩张填满棋盘，保证每区连通且包含一面预设旗子。
4. 过滤超过两个单格区域的棋盘，以及单个区域占比超过 65% 的棋盘。
5. 独立求解棋盘；发现第二个解立即停止并淘汰。接收的关卡必须只有一个解，且与预设答案一致。
6. 将旋转、镜像和颜色重新编号后等价的棋盘去重。

生成器不添加“旗子不能相邻”规则。排列过滤用于关卡设计，不改变玩家的合法答案规则。

### 难度与发布

候选关卡统一标为“未评级”。搜索节点数只是诊断数据，不代表玩家推理难度；当前尚未实现人类推理步骤分析和自动难度分级。区域面积筛选也属于基础外观过滤，仍需实际试玩筛选。

选定候选后，将相应对象合入 `src/levels/levels.json`，调整编号、名称、顺序和人工评定的难度，然后运行：

```powershell
npm run validate:levels
npm run build
```

第一关可保留简单教学布局，其余关卡再从候选中选择。生成器及答案报告仅供离线使用，生产前端仅加载已选关卡。

## 目录

- `src/pages/HomePage.tsx`：游戏大厅。
- `src/games/index.ts`：游戏入口登记。
- `src/games/DukoGame.tsx`：Duko 交互。
- `src/levels/levels.json`：已发布关卡。
- `scripts/generate-levels.mjs`：生成器命令行。
- `scripts/lib/generator.mjs`：种子随机数、区域生长、筛选和去重。
- `scripts/lib/puzzle.mjs`：连通性检查与唯一解求解器。
- `scripts/validate-levels.mjs`：已发布关卡验证。
- `tests/generator.test.mjs`：生成器与独立枚举校验测试。

## GitHub Pages 部署

自动部署配置位于 `.github/workflows/deploy.yml`，推送到 `main` 时执行检查、构建并发布 `dist`。生产构建的资源前缀是 `/duko/`；开发服务仍使用根路径。

首次部署：

1. 在仓库 Settings → Pages → Build and deployment 中，将 Source 设置为 GitHub Actions。
2. 将最新代码推送到 `main`。
3. 在 Actions 中查看 Deploy GitHub Pages，等待 build 和 deploy 成功。

网站地址：https://sleeppoo.github.io/duko/

本地检查发布版本：`npm run build` 后运行 `npm run preview`，访问终端显示地址下的 `/duko/`。网站使用哈希导航，可直接打开 `/duko/#/duko` 进入游戏。
