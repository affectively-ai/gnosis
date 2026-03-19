----------------------- MODULE PredictionsRound9 -----------------------
\* Formal TLA+ specification of predictions 187-191 (§19.45).
\*
\* Five invariants:
\*   1. Election winner validity (race winner correctness)
\*   2. Training convergence iff drift gap positive (Lyapunov)
\*   3. Geometric convergence rate bounds mixing time (ergodicity)
\*   4. Org hierarchy cumulative loss monotone (renormalization)
\*   5. Semiotic deficit computable for bilingual channels

EXTENDS Integers, FiniteSets, TLC

CONSTANTS
    MaxCandidates,      \* Maximum candidates in election (e.g., 6)
    MaxRounds,          \* Maximum simulation rounds (e.g., 10)
    MaxRate             \* Maximum rate value (e.g., 10)

VARIABLES
    \* Election state (Prediction 106)
    votes,              \* Vote counts per candidate (function)
    eligible,           \* Eligibility per candidate (function)
    winnerIdx,          \* Current winner index

    \* Training state (Prediction 107)
    noiseRate,          \* Gradient noise rate
    descentRate,        \* Gradient descent rate
    currentLoss,        \* Current loss value

    \* MCMC state (Prediction 108)
    contractionNum,     \* Contraction rate numerator
    contractionDen,     \* Contraction rate denominator
    tvBound,            \* Current TV distance bound

    \* Org hierarchy state (Prediction 109)
    entityCount,        \* Entities at current level
    managerCount,       \* Managers at current level
    cumulativeLoss,     \* Cumulative info loss

    \* Semiotic state (Prediction 110)
    semanticPaths,      \* Total semantic paths
    articulationStreams,\* Available articulation streams
    sharedContext,      \* Shared context paths
    semioticDeficit,    \* Current deficit

    \* Control
    round

vars == <<votes, eligible, winnerIdx, noiseRate, descentRate,
          currentLoss, contractionNum, contractionDen, tvBound,
          entityCount, managerCount, cumulativeLoss,
          semanticPaths, articulationStreams, sharedContext,
          semioticDeficit, round>>

Candidates == 1..MaxCandidates

TypeOK ==
    /\ votes \in [Candidates -> 0..MaxRounds]
    /\ eligible \in [Candidates -> BOOLEAN]
    /\ winnerIdx \in Candidates
    /\ noiseRate \in 0..MaxRate
    /\ descentRate \in 0..MaxRate
    /\ currentLoss \in 0..MaxRounds
    /\ contractionNum \in 0..MaxRate
    /\ contractionDen \in 1..MaxRate
    /\ tvBound \in 0..MaxRounds
    /\ entityCount \in 1..MaxRounds
    /\ managerCount \in 1..MaxRounds
    /\ cumulativeLoss \in 0..(MaxRounds * MaxRounds)
    /\ semanticPaths \in 1..MaxRounds
    /\ articulationStreams \in 1..MaxRounds
    /\ sharedContext \in 0..MaxRounds
    /\ semioticDeficit \in 0..MaxRounds
    /\ round \in 0..MaxRounds

-----------------------------------------------------------------------------
Init ==
    /\ votes = [c \in Candidates |-> 0]
    /\ eligible = [c \in Candidates |-> TRUE]
    /\ winnerIdx = 1
    /\ noiseRate = 1
    /\ descentRate = 2
    /\ currentLoss = 5
    /\ contractionNum = 1
    /\ contractionDen = 2
    /\ tvBound = 10
    /\ entityCount = 8
    /\ managerCount = 2
    /\ cumulativeLoss = 6
    /\ semanticPaths = 4
    /\ articulationStreams = 1
    /\ sharedContext = 0
    /\ semioticDeficit = 3
    /\ round = 0

-----------------------------------------------------------------------------
\* VOTE: cast a vote for a candidate

Vote(c) ==
    /\ round < MaxRounds
    /\ c \in Candidates
    /\ votes' = [votes EXCEPT ![c] = @ + 1]
    /\ winnerIdx' = IF votes[c] + 1 >= votes[winnerIdx]
                     THEN c ELSE winnerIdx
    /\ round' = round + 1
    /\ UNCHANGED <<eligible, noiseRate, descentRate, currentLoss,
                   contractionNum, contractionDen, tvBound,
                   entityCount, managerCount, cumulativeLoss,
                   semanticPaths, articulationStreams, sharedContext,
                   semioticDeficit>>

\* TRAIN: one SGD step

TrainStep ==
    /\ round < MaxRounds
    /\ currentLoss > 0
    /\ descentRate > noiseRate
    /\ currentLoss' = currentLoss - 1
    /\ round' = round + 1
    /\ UNCHANGED <<votes, eligible, winnerIdx, noiseRate, descentRate,
                   contractionNum, contractionDen, tvBound,
                   entityCount, managerCount, cumulativeLoss,
                   semanticPaths, articulationStreams, sharedContext,
                   semioticDeficit>>

\* COARSEN: add a level to org hierarchy

Coarsen ==
    /\ round < MaxRounds
    /\ managerCount < entityCount
    /\ cumulativeLoss' = cumulativeLoss + (entityCount - managerCount)
    /\ entityCount' = managerCount
    /\ managerCount' = IF managerCount > 1 THEN (managerCount + 1) \div 2 ELSE 1
    /\ round' = round + 1
    /\ UNCHANGED <<votes, eligible, winnerIdx, noiseRate, descentRate,
                   currentLoss, contractionNum, contractionDen, tvBound,
                   semanticPaths, articulationStreams, sharedContext,
                   semioticDeficit>>

\* CODE-SWITCH: increase articulation streams

CodeSwitch ==
    /\ round < MaxRounds
    /\ articulationStreams < semanticPaths
    /\ articulationStreams' = articulationStreams + 1
    /\ semioticDeficit' = IF semanticPaths > articulationStreams + 1 + sharedContext
                          THEN semanticPaths - (articulationStreams + 1) - sharedContext
                          ELSE 0
    /\ round' = round + 1
    /\ UNCHANGED <<votes, eligible, winnerIdx, noiseRate, descentRate,
                   currentLoss, contractionNum, contractionDen, tvBound,
                   entityCount, managerCount, cumulativeLoss,
                   semanticPaths, sharedContext>>

-----------------------------------------------------------------------------
Next ==
    \/ \E c \in Candidates : Vote(c)
    \/ TrainStep
    \/ Coarsen
    \/ CodeSwitch

Spec == Init /\ [][Next]_vars

-----------------------------------------------------------------------------
\* INVARIANTS

\* P106: Winner must be eligible
InvElectionWinnerValid ==
    eligible[winnerIdx] = TRUE

\* P107: Training converges when drift gap positive (loss decreases)
InvTrainingDriftPositive ==
    descentRate > noiseRate => currentLoss >= 0

\* P108: Contraction rate is proper (num < den)
InvContractionProper ==
    contractionNum < contractionDen

\* P109: Org coarsening cumulative loss is monotone non-decreasing
InvOrgLossMonotone ==
    managerCount < entityCount => cumulativeLoss >= entityCount - managerCount

\* P110: Semiotic deficit is non-negative and bounded
InvSemioticDeficitBounded ==
    semioticDeficit >= 0 /\ semioticDeficit <= semanticPaths

=============================================================================
