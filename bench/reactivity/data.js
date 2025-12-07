window.BENCHMARK_DATA = {
  "lastUpdate": 1765146658861,
  "repoUrl": "https://github.com/ka-jo/torq",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "name": "ka-jo",
            "username": "ka-jo",
            "email": "baldwinjkaleb@gmail.com"
          },
          "committer": {
            "name": "Kaleb Baldwin",
            "username": "ka-jo",
            "email": "baldwinjkaleb@gmail.com"
          },
          "id": "79cfdb3d2b7b701848bc339e9f5b245e95507f63",
          "message": "chore (reactivity): add write permission to benchmark workflow",
          "timestamp": "2025-12-07T22:27:04Z",
          "url": "https://github.com/ka-jo/torq/commit/79cfdb3d2b7b701848bc339e9f5b245e95507f63"
        },
        "date": 1765146658099,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "create simple computed",
            "value": 478.1015152987276,
            "unit": "ops/sec"
          },
          {
            "name": "create computed with multiple deps",
            "value": 466.7814185615749,
            "unit": "ops/sec"
          },
          {
            "name": "evaluate clean computed",
            "value": 24837.57964880278,
            "unit": "ops/sec"
          },
          {
            "name": "evaluate dirty computed",
            "value": 1803.0958880536052,
            "unit": "ops/sec"
          },
          {
            "name": "computed chain (depth 10)",
            "value": 187.51178755948496,
            "unit": "ops/sec"
          },
          {
            "name": "computed chain (depth 100)",
            "value": 187.58165972647566,
            "unit": "ops/sec"
          },
          {
            "name": "update chain multiple times",
            "value": 6851.021975506719,
            "unit": "ops/sec"
          },
          {
            "name": "simple diamond",
            "value": 545.3774331172707,
            "unit": "ops/sec"
          },
          {
            "name": "wide diamond (10 branches)",
            "value": 131.83374367485112,
            "unit": "ops/sec"
          },
          {
            "name": "deep diamond (3 levels)",
            "value": 296.94644529605273,
            "unit": "ops/sec"
          },
          {
            "name": "fan-out (1 ref -> 10 computeds)",
            "value": 214.32048948609227,
            "unit": "ops/sec"
          },
          {
            "name": "fan-in (10 refs -> 1 computed)",
            "value": 364.2190960967714,
            "unit": "ops/sec"
          },
          {
            "name": "conditional dependency",
            "value": 774.093035740107,
            "unit": "ops/sec"
          },
          {
            "name": "dispose simple computed (never evaluated)",
            "value": 253.73784871170113,
            "unit": "ops/sec"
          },
          {
            "name": "dispose simple computed (evaluated once)",
            "value": 99.04815809599562,
            "unit": "ops/sec"
          },
          {
            "name": "dispose computed with multiple deps",
            "value": 582.585186049823,
            "unit": "ops/sec"
          },
          {
            "name": "dispose computed chain (depth 10)",
            "value": 265.4095174364334,
            "unit": "ops/sec"
          },
          {
            "name": "dispose computed diamond",
            "value": 302.38635091990386,
            "unit": "ops/sec"
          },
          {
            "name": "dispose computed with 10 subscribers",
            "value": 330.33950947556383,
            "unit": "ops/sec"
          },
          {
            "name": "create simple effect",
            "value": 937.6816608268771,
            "unit": "ops/sec"
          },
          {
            "name": "create effect with multiple deps",
            "value": 582.4999136024937,
            "unit": "ops/sec"
          },
          {
            "name": "effect execution (1 dependency)",
            "value": 6659.626741240252,
            "unit": "ops/sec"
          },
          {
            "name": "effect execution (10 dependencies)",
            "value": 790.9555321464181,
            "unit": "ops/sec"
          },
          {
            "name": "effect reading computed",
            "value": 5958.81576878915,
            "unit": "ops/sec"
          },
          {
            "name": "effect reading computed chain",
            "value": 5810.843037907573,
            "unit": "ops/sec"
          },
          {
            "name": "effect with diamond computed",
            "value": 4840.026227624808,
            "unit": "ops/sec"
          },
          {
            "name": "fan-out (1 ref -> 10 effects)",
            "value": 2233.5663173624043,
            "unit": "ops/sec"
          },
          {
            "name": "fan-out (1 ref -> 100 effects)",
            "value": 854.2210504935119,
            "unit": "ops/sec"
          },
          {
            "name": "conditional effect dependency",
            "value": 2903.1722997709862,
            "unit": "ops/sec"
          },
          {
            "name": "effect create/dispose cycle",
            "value": 761.3939882512757,
            "unit": "ops/sec"
          },
          {
            "name": "nested effects",
            "value": 6680.021337599292,
            "unit": "ops/sec"
          },
          {
            "name": "dispose simple effect (1 dependency)",
            "value": 1007.6130322606107,
            "unit": "ops/sec"
          },
          {
            "name": "dispose effect with 10 dependencies",
            "value": 270.4676143421026,
            "unit": "ops/sec"
          },
          {
            "name": "simple login form",
            "value": 131.30890338348206,
            "unit": "ops/sec"
          },
          {
            "name": "multi-field validation",
            "value": 167.46078364493857,
            "unit": "ops/sec"
          },
          {
            "name": "form with computed totals",
            "value": 118.94149184955144,
            "unit": "ops/sec"
          },
          {
            "name": "add and filter todos",
            "value": 14.524341097056988,
            "unit": "ops/sec"
          },
          {
            "name": "todo counters",
            "value": 7.468746786338294,
            "unit": "ops/sec"
          },
          {
            "name": "RGB color picker",
            "value": 381.18266812300834,
            "unit": "ops/sec"
          },
          {
            "name": "color picker with alpha",
            "value": 290.09533152523727,
            "unit": "ops/sec"
          },
          {
            "name": "sortable table",
            "value": 180.4991556576748,
            "unit": "ops/sec"
          },
          {
            "name": "filtered and paginated table",
            "value": 35.21338509283594,
            "unit": "ops/sec"
          },
          {
            "name": "create primitive ref",
            "value": 698.1851250186928,
            "unit": "ops/sec"
          },
          {
            "name": "create object ref",
            "value": 275.7600512520426,
            "unit": "ops/sec"
          },
          {
            "name": "create 100 refs in sequence",
            "value": 7152.100630939845,
            "unit": "ops/sec"
          },
          {
            "name": "read ref (untracked)",
            "value": 4921.545101586337,
            "unit": "ops/sec"
          },
          {
            "name": "read ref (in computed)",
            "value": 1373.7035959751042,
            "unit": "ops/sec"
          },
          {
            "name": "read ref (in effect)",
            "value": 925.191269956726,
            "unit": "ops/sec"
          },
          {
            "name": "read multiple refs (in computed)",
            "value": 799.4331619165391,
            "unit": "ops/sec"
          },
          {
            "name": "write ref (no subscribers)",
            "value": 11938.31738967029,
            "unit": "ops/sec"
          },
          {
            "name": "write ref (same value)",
            "value": 7378.951583801739,
            "unit": "ops/sec"
          },
          {
            "name": "write ref with 1 subscriber",
            "value": 7415.802858297023,
            "unit": "ops/sec"
          },
          {
            "name": "write ref with 10 subscribers",
            "value": 2226.773613339554,
            "unit": "ops/sec"
          },
          {
            "name": "subscribe/unsubscribe cycle",
            "value": 4770.5051812836355,
            "unit": "ops/sec"
          },
          {
            "name": "subscription with notifications",
            "value": 2897.7180578283655,
            "unit": "ops/sec"
          },
          {
            "name": "10 subscriptions, 100 updates",
            "value": 4571.1335964806285,
            "unit": "ops/sec"
          },
          {
            "name": "dispose ref (no subscribers)",
            "value": 426.9236333049408,
            "unit": "ops/sec"
          },
          {
            "name": "dispose ref with 1 subscriber",
            "value": 2160.212333565098,
            "unit": "ops/sec"
          },
          {
            "name": "dispose ref with 10 subscribers",
            "value": 523.7133266569716,
            "unit": "ops/sec"
          },
          {
            "name": "dispose ref with 100 subscribers",
            "value": 603.2019023565913,
            "unit": "ops/sec"
          },
          {
            "name": "create empty scope",
            "value": 1181.993158623596,
            "unit": "ops/sec"
          },
          {
            "name": "dispose empty scope",
            "value": 754.2839241185324,
            "unit": "ops/sec"
          },
          {
            "name": "dispose scope with 1 effect",
            "value": 899.7746334475629,
            "unit": "ops/sec"
          },
          {
            "name": "dispose scope with 10 effects",
            "value": 117.33965396571845,
            "unit": "ops/sec"
          },
          {
            "name": "dispose scope with 100 effects",
            "value": 118.45999799253758,
            "unit": "ops/sec"
          },
          {
            "name": "dispose nested scopes (3 levels)",
            "value": 2137.7332279950147,
            "unit": "ops/sec"
          },
          {
            "name": "dispose parent with 10 child scopes",
            "value": 90.81612983149671,
            "unit": "ops/sec"
          },
          {
            "name": "dispose deeply nested scopes (depth 10)",
            "value": 926.8615489354659,
            "unit": "ops/sec"
          },
          {
            "name": "nested scopes (3 levels)",
            "value": 3483.2951552254685,
            "unit": "ops/sec"
          },
          {
            "name": "dispose nested scopes (3 levels)",
            "value": 2154.784886635441,
            "unit": "ops/sec"
          },
          {
            "name": "parent with 10 child scopes",
            "value": 599.5646549049438,
            "unit": "ops/sec"
          },
          {
            "name": "nested scopes with effects",
            "value": 311.07962737126667,
            "unit": "ops/sec"
          },
          {
            "name": "create, use, dispose cycle",
            "value": 733.5686821548685,
            "unit": "ops/sec"
          },
          {
            "name": "repeated scope creation/disposal",
            "value": 102.64481763025114,
            "unit": "ops/sec"
          },
          {
            "name": "scope churn (no memory leaks)",
            "value": 94.91986828136056,
            "unit": "ops/sec"
          },
          {
            "name": "scope with abort signal",
            "value": 209.22884357739812,
            "unit": "ops/sec"
          },
          {
            "name": "multiple scopes with same signal",
            "value": 84.2586226639559,
            "unit": "ops/sec"
          },
          {
            "name": "create empty struct",
            "value": 513.3531473133156,
            "unit": "ops/sec"
          },
          {
            "name": "create struct with 1 property",
            "value": 512.1233822478192,
            "unit": "ops/sec"
          },
          {
            "name": "create struct with 10 properties",
            "value": 477.92485300780936,
            "unit": "ops/sec"
          },
          {
            "name": "create struct with ref properties",
            "value": 471.0605535746745,
            "unit": "ops/sec"
          },
          {
            "name": "read primitive property (untracked)",
            "value": 1819.3043344086152,
            "unit": "ops/sec"
          },
          {
            "name": "read primitive property (in computed)",
            "value": 1259.5641605709204,
            "unit": "ops/sec"
          },
          {
            "name": "read 10 properties (untracked)",
            "value": 1486.1906075210675,
            "unit": "ops/sec"
          },
          {
            "name": "read 10 properties (in computed)",
            "value": 305.9456253011853,
            "unit": "ops/sec"
          },
          {
            "name": "read property in effect",
            "value": 863.0431997593773,
            "unit": "ops/sec"
          },
          {
            "name": "write primitive property (no subscribers)",
            "value": 568.315189837665,
            "unit": "ops/sec"
          },
          {
            "name": "write property with 1 effect",
            "value": 5355.444137031364,
            "unit": "ops/sec"
          },
          {
            "name": "write property with 10 effects",
            "value": 2024.6019394752034,
            "unit": "ops/sec"
          },
          {
            "name": "effect reacts to property change",
            "value": 5593.625171177713,
            "unit": "ops/sec"
          },
          {
            "name": "computed from struct property",
            "value": 1425.1289782700255,
            "unit": "ops/sec"
          },
          {
            "name": "computed chain from struct",
            "value": 579.9435053833624,
            "unit": "ops/sec"
          },
          {
            "name": "struct diamond pattern",
            "value": 472.97503566517224,
            "unit": "ops/sec"
          },
          {
            "name": "struct wrapping refs (auto-unwrap)",
            "value": 7284.588188531165,
            "unit": "ops/sec"
          },
          {
            "name": "write to ref through struct",
            "value": 1219.1856132707182,
            "unit": "ops/sec"
          },
          {
            "name": "effect tracking ref through struct",
            "value": 7480.32331545103,
            "unit": "ops/sec"
          }
        ]
      }
    ]
  }
}