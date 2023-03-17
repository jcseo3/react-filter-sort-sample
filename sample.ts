import React, { useState } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';

import ResourceBrowse from '../../data/ResourceBrowse';
import ResourceBrowseFilterList from '../../data/ResourceBrowseFilterList';
import FilterAndSort, { SortOption } from '../../modules/FilterAndSort';
import TextStyle from '../../elements/TextStyle';
import { notEmpty } from '../../../utils';

import { AllResourcesPage_viewer } from 'Types/AllResourcesPage_viewer.graphql';

const styles = require('./styles.scss');

interface Props {
  viewer: AllResourcesPage_viewer;
}

// sort options are fixed
// default sort order is desc
// items can be added in the CMS but needs to be in desc order (i.e., low -> high)
const sortOptions: SortOption[] = [
  {
    sectionSpeakingId: 'skillLevel',
    displayName: 'Skill Level',
  },
  {
    sectionSpeakingId: 'skillLevel',
    displayName: 'Skill Level',
    order: 'asc',
  },
  {
    sectionSpeakingId: 'riskLevel',
    displayName: 'Risk Level',
  },
  {
    sectionSpeakingId: 'riskLevel',
    displayName: 'Risk Level',
    order: 'asc',
  },
];

const AllResourcesPage = ({ viewer }: Props) => {
  /** resources can be filtered by topic
   * AND they can also be sorted by skill or risk level */
  const [activeFilterId, setActiveFilterId] = useState('all-resources');
  const [activeFilterDisplayName, setActiveFilterDisplayName] =
    useState('All Resources');
  const summary = viewer?.realmContent?.nodeSpeaking?.summary?.text || '';
  const [activeFilterSummary, setActiveFilterSummary] = useState(summary);

  // index of the sort option
  const [activeSortId, setActiveSortId] = useState(0);

  /** the lists contain the order that we want to sort the resources by (editable in CMS)
   * e.g.,
   * skillLevel = ['beginner', 'intermediate', 'advanced']
   * riskLevel = ['moderate', 'moderate-high', 'high']
   */
  const skillLevel =
    viewer?.realmContent?.skillLevels?.members?.edges?.map(
      (edge) => edge?.node?.speakingId
    ) || [];
  const riskLevel =
    viewer?.realmContent?.riskLevels?.members?.edges?.map(
      (edge) => edge?.node?.speakingId
    ) || [];

  const currentSortOption = sortOptions[activeSortId];
  const sortArray =
    (currentSortOption.sectionSpeakingId === 'skillLevel' &&
      (currentSortOption.order === 'asc'
        ? skillLevel.reverse()
        : skillLevel)) ||
    (currentSortOption.sectionSpeakingId === 'riskLevel' &&
      (currentSortOption.order === 'asc' ? riskLevel.reverse() : riskLevel)) ||
    [];

  const resources =
    viewer?.realmContent?.resources?.edges
      ?.map((edge) => edge?.node)
      .filter(notEmpty) || [];

  return (
    <div className={styles.container}>
      <div className={styles.topics}>
        <ResourceBrowseFilterList
          nodes={resources}
          itemsType="resource"
          setActiveFilterId={setActiveFilterId}
          activeFilterId={activeFilterId}
          setActiveFilterDisplayName={setActiveFilterDisplayName}
          setActiveFilterSummary={setActiveFilterSummary}
          activeFilterSummary={activeFilterSummary}
          setActiveSortId={setActiveSortId}
          activeSortId={activeSortId}
        />
      </div>
      <div className={styles.resources}>
        <TextStyle Component="div" className={styles.title}>
          {activeFilterDisplayName}
        </TextStyle>
        <TextStyle Component="div" className={styles.summary}>
          {activeFilterSummary}
        </TextStyle>
        <div className={styles.sortByWrapper}>
          <div className={styles.sortByContainer}>
            <FilterAndSort
              selectedItem={activeSortId}
              onSelect={(index) => {
                setActiveSortId(index);
              }}
            >
              {{
                sortOptions,
              }}
            </FilterAndSort>
          </div>
        </div>
        {activeFilterId === 'all-resources' ? (
          <ResourceBrowse
            activeSortOptionId={sortOptions[activeSortId]?.sectionSpeakingId}
            sortArray={sortArray}
            resourceFilterId=""
          />
        ) : (
          <ResourceBrowse
            resourceFilterId={activeFilterId}
            activeSortOptionId={sortOptions[activeSortId]?.sectionSpeakingId}
            sortArray={sortArray}
          />
        )}
      </div>
    </div>
  );
};

export default createFragmentContainer(AllResourcesPage, {
  viewer: graphql`
    fragment AllResourcesPage_viewer on Viewer
    @argumentDefinitions(realmId: { type: "ID!" }) {
      realmContent(id: $realmId) {
        resources: nodesByTypes(
          first: 99
          nodeSubtypeSpecs: [{ nodeType: Article, nodeSubtype: "resource" }]
        ) {
          edges {
            node {
              ...ResourceBrowseFilterList_nodes
              ...ResourceData_node
            }
          }
        }
        nodeSpeaking(id: "all-resources") {
          ... on Article {
            summary(format: plain) {
              text
            }
          }
        }
        riskLevels: listSpeaking(id: "risk-levels") {
          members(first: 99) {
            edges {
              node {
                ... on Section {
                  speakingId
                }
              }
            }
          }
        }
        skillLevels: listSpeaking(id: "skill-levels") {
          members(first: 99) {
            edges {
              node {
                ... on Section {
                  speakingId
                }
              }
            }
          }
        }
      }
    }
  `,
});
