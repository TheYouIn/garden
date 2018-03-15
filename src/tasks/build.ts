import { Task } from "../task-graph"
import { Module } from "../types/module"
import { GardenContext } from "../context"
import { EntryStyle } from "../logger/types"
import chalk from "chalk"
import { round } from "lodash"

export class BuildTask extends Task {
  type = "build"

  constructor(private ctx: GardenContext, private module: Module, private force: boolean) {
    super()
  }

  async getDependencies() {
    const deps = await this.module.getBuildDependencies()
    return deps.map((m: Module) => new BuildTask(this.ctx, m, this.force))
  }

  getKey() {
    // TODO: Include version in the task key (may need to make this method async).
    return this.module.name
  }

  async process() {
    const entry = this.ctx.log.info({
      section: this.module.name,
      msg: "Building",
      entryStyle: EntryStyle.activity,
    })

    if (this.force || !(await this.module.getBuildStatus()).ready) {
      await this.ctx.buildDir.syncDependencyProducts(this.module)
      const startTime = new Date().getTime()
      const result = await this.ctx.buildModule(this.module, entry)
      const buildTime = (new Date().getTime()) - startTime

      entry.setSuccess({ msg: chalk.green(`Done (took ${round(buildTime / 1000, 1)} sec)`), append: true })

      return result
    } else {
      entry.setSuccess({ msg: "Already built" })
      return { fresh: false }
    }
  }
}
