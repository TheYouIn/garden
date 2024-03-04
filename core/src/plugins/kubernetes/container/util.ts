/*
 * Copyright (C) 2018-2024 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getPortForward } from "../port-forward.js"
import { CLUSTER_REGISTRY_DEPLOYMENT_NAME, CLUSTER_REGISTRY_PORT } from "../constants.js"
import type { Log } from "../../../logger/log-entry.js"
import type { KubernetesResourceConfig, KubernetesPluginContext, KubernetesResourceSpec } from "../config.js"
import { getSystemNamespace } from "../namespace.js"
import type {
  ContainerBuildAction,
  ContainerResourcesSpec,
  ContainerRuntimeAction,
  ServiceLimitSpec,
} from "../../container/moduleConfig.js"
import type { V1ResourceRequirements, V1SecurityContext } from "@kubernetes/client-node"
import { ConfigurationError } from "../../../exceptions.js"
import type { Resolved } from "../../../actions/types.js"
import { kilobytesToString, megabytesToString, millicpuToString } from "../util.js"

export function getDeployedImageId(action: Resolved<ContainerRuntimeAction>): string {
  const explicitImage = action.getSpec().image
  const build = action.getResolvedBuildAction<Resolved<ContainerBuildAction>>()

  // if there is a build, we had a configured dockerfile and should use that image
  if (build) {
    return build.getOutput("deployment-image-id")
  } else if (explicitImage) {
    return explicitImage
  } else {
    throw new ConfigurationError({
      message: `${action.longDescription()} specifies neither a \`build\` nor \`spec.image\``,
    })
  }
}

export async function getRegistryPortForward(ctx: KubernetesPluginContext, log: Log) {
  const systemNamespace = await getSystemNamespace(ctx, ctx.provider, log)

  return getPortForward({
    ctx,
    log,
    namespace: systemNamespace,
    targetResource: `Deployment/${CLUSTER_REGISTRY_DEPLOYMENT_NAME}`,
    port: CLUSTER_REGISTRY_PORT,
  })
}

export function getResourceRequirements(
  resources: ContainerResourcesSpec,
  limits?: ServiceLimitSpec
): V1ResourceRequirements {
  const maxCpu = limits?.cpu || resources.cpu.max
  const maxMemory = limits?.memory || resources.memory.max

  const resourceReq: V1ResourceRequirements = {
    requests: {
      cpu: millicpuToString(resources.cpu.min),
      memory: kilobytesToString(resources.memory.min * 1024),
    },
  }
  if (maxMemory || maxCpu) {
    resourceReq.limits = {}
  }
  if (maxMemory) {
    resourceReq.limits!.memory = kilobytesToString(maxMemory * 1024)
  }
  if (maxCpu) {
    resourceReq.limits!.cpu = millicpuToString(maxCpu)
  }

  return resourceReq
}

export function getSecurityContext(
  privileged: boolean | undefined,
  addCapabilities: string[] | undefined,
  dropCapabilities: string[] | undefined
): V1SecurityContext | null {
  if (!privileged && !addCapabilities && !dropCapabilities) {
    return null
  }
  const ctx: V1SecurityContext = {}
  if (privileged) {
    ctx.privileged = privileged
  }
  if (addCapabilities) {
    ctx.capabilities = { add: addCapabilities }
  }
  if (dropCapabilities) {
    ctx.capabilities = { ...(ctx.capabilities || {}), drop: dropCapabilities }
  }
  return ctx
}

export function stringifyResources(resources: KubernetesResourceSpec) {
  const stringify = (r: KubernetesResourceConfig) => ({
    cpu: millicpuToString(r.cpu),
    memory: megabytesToString(r.memory),
    ...(r.ephemeralStorage ? { "ephemeral-storage": megabytesToString(r.ephemeralStorage) } : {}),
  })

  return {
    limits: stringify(resources.limits),
    requests: stringify(resources.requests),
  }
}
