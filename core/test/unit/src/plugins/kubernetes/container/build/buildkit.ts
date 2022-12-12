/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { expect } from "chai"
<<<<<<< HEAD
import { ClusterBuildkitCacheConfig } from "../../../../../../../src/plugins/kubernetes/config"
import { ContainerBuildAction } from "../../../../../../../src/plugins/container/config"
import {
  getBuildkitFlags,
=======
import { DeepPartial } from "typeorm-with-better-sqlite3"
import {
  ClusterBuildkitCacheConfig,
  defaultResources,
  KubernetesProvider,
} from "../../../../../../../src/plugins/kubernetes/config"
import { inClusterRegistryHostname, k8sUtilImageName } from "../../../../../../../src/plugins/kubernetes/constants"
import {
  buildkitImageName,
  getBuildkitDeployment,
>>>>>>> main
  getBuildkitImageFlags,
} from "../../../../../../../src/plugins/kubernetes/container/build/buildkit"
import { getDataDir, makeTestGarden } from "../../../../../../helpers"

<<<<<<< HEAD
describe("getBuildkitModuleFlags", () => {
  it("should correctly format the build target option", async () => {
    const projectRoot = getDataDir("test-project-container")
    const garden = await makeTestGarden(projectRoot)
    const graph = await garden.getConfigGraph({ log: garden.log, emit: false })
    const rawBuild = graph.getBuild("module-a.build") as ContainerBuildAction
    const build = await garden.resolveAction({ action: rawBuild, log: garden.log, graph })

    build._config.spec.targetStage = "foo"

    const flags = getBuildkitFlags(build)

    expect(flags).to.eql(["--opt", "build-arg:GARDEN_MODULE_VERSION=" + build.versionString, "--opt", "target=foo"])
=======
describe("buildkit build", () => {
  describe("getBuildkitDeployment", () => {
    const _provider: DeepPartial<KubernetesProvider> = {
      config: {
        resources: defaultResources,
      },
    }
    let provider = _provider as KubernetesProvider
    beforeEach(() => {
      provider = _provider as KubernetesProvider
    })

    it("should return a Kubernetes Deployment manifest for buildkit in-cluster-builder", () => {
      const result = getBuildkitDeployment(provider, "authSecretName", [{ name: "imagePullSecretName" }])
      expect(result.kind).eql("Deployment")
      expect(result.metadata).eql({
        annotations: undefined,
        labels: {
          app: "garden-buildkit",
        },
        name: "garden-buildkit",
      })
      expect(result.spec.template.metadata).eql({
        annotations: undefined,
        labels: {
          app: "garden-buildkit",
        },
      })

      expect(result.spec.template.spec?.containers.length === 2)

      expect(result.spec.template.spec?.containers[0]).eql({
        args: ["--addr", "unix:///run/buildkit/buildkitd.sock"],
        env: [
          {
            name: "DOCKER_CONFIG",
            value: "/.docker",
          },
        ],
        image: buildkitImageName,
        livenessProbe: {
          exec: {
            command: ["buildctl", "debug", "workers"],
          },
          initialDelaySeconds: 5,
          periodSeconds: 30,
        },
        name: "buildkitd",
        readinessProbe: {
          exec: {
            command: ["buildctl", "debug", "workers"],
          },
          initialDelaySeconds: 3,
          periodSeconds: 5,
        },
        resources: {
          limits: {
            cpu: "4",
            memory: "8Gi",
          },
          requests: {
            cpu: "100m",
            memory: "512Mi",
          },
        },
        securityContext: {
          privileged: true,
        },
        volumeMounts: [
          {
            mountPath: "/.docker",
            name: "authSecretName",
            readOnly: true,
          },
          {
            mountPath: "/garden-build",
            name: "garden-sync",
          },
        ],
      })

      expect(result.spec.template.spec?.containers[1]).eql({
        command: ["/rsync-server.sh"],
        env: [
          {
            name: "ALLOW",
            value: "0.0.0.0/0",
          },
          {
            name: "RSYNC_PORT",
            value: "8730",
          },
        ],
        image: k8sUtilImageName,
        imagePullPolicy: "IfNotPresent",
        lifecycle: {
          preStop: {
            exec: {
              command: [
                "/bin/sh",
                "-c",
                "until test $(pgrep -fc '^[^ ]+rsync') = 1; do echo waiting for rsync to finish...; sleep 1; done",
              ],
            },
          },
        },
        name: "util",
        ports: [
          {
            containerPort: 8730,
            name: "garden-rsync",
            protocol: "TCP",
          },
        ],
        readinessProbe: {
          failureThreshold: 5,
          initialDelaySeconds: 1,
          periodSeconds: 1,
          successThreshold: 2,
          tcpSocket: {
            port: "garden-rsync",
          },
          timeoutSeconds: 3,
        },
        resources: {
          limits: {
            cpu: "256m",
            memory: "512Mi",
          },
          requests: {
            cpu: "256m",
            memory: "512Mi",
          },
        },
        securityContext: {
          runAsGroup: 1000,
          runAsUser: 1000,
        },
        volumeMounts: [
          {
            mountPath: "/home/user/.docker",
            name: "authSecretName",
            readOnly: true,
          },
          {
            mountPath: "/data",
            name: "garden-sync",
          },
        ],
      })
    })

    it("should return a Kubernetes Deployment with the configured annotations", () => {
      provider.config.clusterBuildkit = {
        cache: [],
        annotations: {
          buildkitAnnotation: "is-there",
        },
      }
      const result = getBuildkitDeployment(provider, "authSecretName", [{ name: "imagePullSecretName" }])
      expect(result.metadata.annotations).eql(provider.config.clusterBuildkit.annotations)
      expect(result.spec.template.metadata?.annotations).eql(provider.config.clusterBuildkit.annotations)
    })
>>>>>>> main
  })

  describe("getBuildkitModuleFlags", () => {
    it("should correctly format the build target option", async () => {
      const projectRoot = getDataDir("test-project-container")
      const garden = await makeTestGarden(projectRoot)
      const graph = await garden.getConfigGraph({ log: garden.log, emit: false })
      const module = graph.getModule("module-a")

      module.spec.build.targetImage = "foo"

      const flags = getBuildkitModuleFlags(module)

      expect(flags).to.eql([
        "--opt",
        "build-arg:GARDEN_MODULE_VERSION=" + module.version.versionString,
        "--opt",
        "target=foo",
      ])
    })
  })

  describe("getBuildkitImageFlags()", () => {
    const defaultConfig: ClusterBuildkitCacheConfig[] = [
      {
        type: "registry",
        mode: "auto",
        tag: "_buildcache",
        export: true,
      },
    ]

    // test autodetection for mode=inline
    const expectedInline = [
      // The following registries are actually known NOT to support mode=max
      "eu.gcr.io",
      "gcr.io",
      "aws_account_id.dkr.ecr.region.amazonaws.com",
      "keks.dkr.ecr.bla.amazonaws.com",
      // Most self-hosted registries actually support mode=max, but because
      // Harbor actually doesn't, we need to default to inline.
      "anyOtherRegistry",
      "127.0.0.1",
    ]
    for (const registry of expectedInline) {
      it(`returns type=inline cache flags with default config with registry ${registry}`, async () => {
        const moduleOutputs = {
          "local-image-id": "name:v-xxxxxx",
          "local-image-name": "name",
          "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
          "deployment-image-name": `${registry}/namespace/name`,
        }

        const flags = getBuildkitImageFlags(defaultConfig, moduleOutputs, false)

        expect(flags).to.eql([
          "--export-cache",
          "type=inline",
          "--output",
          `type=image,"name=${registry}/namespace/name:v-xxxxxx,${registry}/namespace/name:_buildcache",push=true`,
          "--import-cache",
          `type=registry,ref=${registry}/namespace/name:_buildcache`,
        ])
      })
    }

    // test autodetection for mode=max
    const expectedMax = [
      // The following registries are known to actually support mode=max
      "hub.docker.com",
      "pkg.dev",
      "some.subdomain.pkg.dev",
      "ghcr.io",
      "GHCR.io",
      "azurecr.io",
      "some.subdomain.azurecr.io",
    ]
    for (const registry of expectedMax) {
      it(`returns mode=max cache flags with default config with registry ${registry}`, async () => {
        const moduleOutputs = {
          "local-image-id": "name:v-xxxxxx",
          "local-image-name": "name",
          "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
          "deployment-image-name": `${registry}/namespace/name`,
        }

        const flags = getBuildkitImageFlags(defaultConfig, moduleOutputs, false)

        expect(flags).to.eql([
          "--output",
          `type=image,"name=${registry}/namespace/name:v-xxxxxx",push=true`,
          "--import-cache",
          `type=registry,ref=${registry}/namespace/name:_buildcache`,
          "--export-cache",
          `type=registry,ref=${registry}/namespace/name:_buildcache,mode=max`,
        ])
      })
    }

    // explicit min / max
    const explicitModes: ClusterBuildkitCacheConfig["mode"][] = ["min", "max"]
    for (const mode of explicitModes) {
      it(`returns mode=${mode} cache flags if explicitly configured`, async () => {
        const registry = "explicitTeamRegistry"

        const moduleOutputs = {
          "local-image-id": "name:v-xxxxxx",
          "local-image-name": "name",
          "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
          "deployment-image-name": `${registry}/namespace/name`,
        }

        const config: ClusterBuildkitCacheConfig[] = [
          {
            type: "registry",
            mode,
            tag: "_buildcache",
            export: true,
          },
        ]

        const flags = getBuildkitImageFlags(config, moduleOutputs, false)

        expect(flags).to.eql([
          "--output",
          `type=image,"name=${registry}/namespace/name:v-xxxxxx",push=true`,
          "--import-cache",
          `type=registry,ref=${registry}/namespace/name:_buildcache`,
          "--export-cache",
          `type=registry,ref=${registry}/namespace/name:_buildcache,mode=${mode}`,
        ])
      })
    }

    // explicit inline
    it(`returns type=inline cache flags when explicitly configured`, async () => {
      const registry = "someExplicitInlineRegistry"

      const moduleOutputs = {
        "local-image-id": "name:v-xxxxxx",
        "local-image-name": "name",
        "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
        "deployment-image-name": `${registry}/namespace/name`,
      }

      const config: ClusterBuildkitCacheConfig[] = [
        {
          type: "registry",
          mode: "inline",
          tag: "_buildcache",
          export: true,
        },
      ]

      const flags = getBuildkitImageFlags(config, moduleOutputs, false)

      expect(flags).to.eql([
        "--export-cache",
        "type=inline",
        "--output",
        `type=image,"name=${registry}/namespace/name:v-xxxxxx,${registry}/namespace/name:_buildcache",push=true`,
        "--import-cache",
        `type=registry,ref=${registry}/namespace/name:_buildcache`,
      ])
    })

    it("uses registry.insecure=true with the in-cluster registry", async () => {
      const registry = inClusterRegistryHostname

      const moduleOutputs = {
        "local-image-id": "name:v-xxxxxx",
        "local-image-name": "name",
        "deployment-image-id": `${registry}/namespace/name:v-xxxxxx`,
        "deployment-image-name": `${registry}/namespace/name`,
      }

      const flags = getBuildkitImageFlags(
        defaultConfig,
        moduleOutputs,
        true // deploymentRegistryInsecure
      )

      expect(flags).to.eql([
        "--output",
        `type=image,"name=${registry}/namespace/name:v-xxxxxx",push=true,registry.insecure=true`,
        "--import-cache",
        `type=registry,ref=${registry}/namespace/name:_buildcache,registry.insecure=true`,
        "--export-cache",
        `type=registry,ref=${registry}/namespace/name:_buildcache,mode=max,registry.insecure=true`,
      ])
    })

    it("returns correct flags with separate cache registry", async () => {
      const deploymentRegistry = "gcr.io/deploymentRegistry"
      const cacheRegistry = "pkg.dev/cacheRegistry"

<<<<<<< HEAD
  it("returns correct flags with separate cache registry", async () => {
    const deploymentRegistry = "gcr.io/deploymentRegistry"
    const cacheRegistry = "pkg.dev/cacheRegistry"

    const moduleOutputs = {
      "local-image-id": "name:v-xxxxxx",
      "local-image-name": "name",
      "deployment-image-id": `${deploymentRegistry}/namespace/name:v-xxxxxx`,
      "deployment-image-name": `${deploymentRegistry}/namespace/name`,
    }

    const config: ClusterBuildkitCacheConfig[] = [
      {
        type: "registry",
        registry: {
          hostname: cacheRegistry,
          namespace: "namespace",
          insecure: false,
=======
      const moduleOutputs = {
        "local-image-id": "name:v-xxxxxx",
        "local-image-name": "name",
        "deployment-image-id": `${deploymentRegistry}/namespace/name:v-xxxxxx`,
        "deployment-image-name": `${deploymentRegistry}/namespace/name`,
      }

      const config: ClusterBuildkitCacheConfig[] = [
        {
          type: "registry",
          registry: {
            hostname: cacheRegistry,
            namespace: "namespace",
            insecure: false,
          },
          mode: "auto",
          tag: "_buildcache",
          export: true,
>>>>>>> main
        },
      ]

      const flags = getBuildkitImageFlags(config, moduleOutputs, false)

      expect(flags).to.eql([
        // output to deploymentRegistry
        "--output",
        `type=image,"name=${deploymentRegistry}/namespace/name:v-xxxxxx",push=true`,

        // import and export to cacheRegistry with mode=max
        "--import-cache",
        `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache`,
        "--export-cache",
        `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache,mode=max`,
      ])
    })

    it("returns correct flags for complex cache registry use case", async () => {
      const deploymentRegistry = "gcr.io/someBigTeamDeploymentRegistry"
      const cacheRegistry = "pkg.dev/someBigTeamCacheRegistry"

      const moduleOutputs = {
        "local-image-id": "name:v-xxxxxx",
        "local-image-name": "name",
        "deployment-image-id": `${deploymentRegistry}/namespace/name:v-xxxxxx`,
        "deployment-image-name": `${deploymentRegistry}/namespace/name`,
      }

      const config: ClusterBuildkitCacheConfig[] = [
        {
          type: "registry",
          registry: {
            hostname: cacheRegistry,
            namespace: "namespace",
            insecure: false,
          },
          mode: "auto",
          tag: "_buildcache-featureBranch",
          export: true,
        },
        {
          type: "registry",
          registry: {
            hostname: cacheRegistry,
            namespace: "namespace",
            insecure: false,
          },
          mode: "auto",
          tag: "_buildcache-main",
          export: false,
        },
      ]

      const flags = getBuildkitImageFlags(config, moduleOutputs, false)

      expect(flags).to.eql([
        // output to deploymentRegistry
        "--output",
        `type=image,"name=${deploymentRegistry}/namespace/name:v-xxxxxx",push=true`,
        // import and export to cacheRegistry with mode=max
        // import first _buildcache-featureBranch, then _buildcache-main
        "--import-cache",
        `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-featureBranch`,
        "--export-cache",
        `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-featureBranch,mode=max`,
        "--import-cache",
        `type=registry,ref=${cacheRegistry}/namespace/name:_buildcache-main`,
      ])
    })
  })
})
