/**
 * Copyright (C) 2011  JTalks.org Team
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jtalks.jcommune.service;

import org.jtalks.jcommune.model.entity.Branch;
import org.jtalks.jcommune.model.entity.Topic;
import org.springframework.data.domain.Page;

/**
 * Serves all kinds of fetch topic requests
 */
public interface TopicFetchService extends EntityService<Topic>{

    /**
     * Get topics in the branch.
     *
     * @param branch        for this branch we will find topics
     * @param page          page number, for which we will find topics
     * @param pagingEnabled if true, then it returns topics for one page, otherwise it
     *                      return all topics in the branch
     * @return object that contains topics for one page(note, that one page may contain
     *         all topics) and information for pagination
     */
    Page<Topic> getTopics(Branch branch, int page, boolean pagingEnabled);

    /**
     * Get topics that have been updated in the last 24 hours.
     *
     * @param page page page number, for which we will find topics
     * @return object that contains topics(that have been updated in the last 24 hours)
     *         for one page and information for pagination
     */
    Page<Topic> getRecentTopics(int page);

    /**
     * Get unanswered topics(topics which has only 1 post added during topic creation).
     *
     * @param page page number, for which we will find topics
     * @return object that contains unanswered topics for one page and information for
     *         pagination
     */
    Page<Topic> getUnansweredTopics(int page);
}
